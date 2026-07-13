<?php

namespace App\Http\Controllers\Host;

use App\Http\Controllers\Controller;
use App\Models\User\User;
use App\Models\Property\Property;
use App\Models\Reservation\Reservation;
use Illuminate\Http\Request;

class HostController extends Controller
{
    private function imageUrl($image)
    {
        if (!$image) {
            return null;
        }

        if (is_object($image)) {
            $image = $image->image_path ?? $image->url ?? null;
        }

        if (!$image) {
            return null;
        }

        if (filter_var($image, FILTER_VALIDATE_URL)) {
            return $image;
        }

        if (str_starts_with($image, '/storage/')) {
            return url($image);
        }

        if (str_starts_with($image, 'storage/')) {
            return url('/' . $image);
        }

        return asset('storage/' . ltrim($image, '/'));
    }

    private function propertyImages($property)
    {
        if (!$property || !$property->images) {
            return collect();
        }

        return $property->images
            ->map(fn ($image) => $this->imageUrl($image))
            ->filter()
            ->values();
    }

    private function formatProperty($property)
    {
        $images = $this->propertyImages($property);

        $cover = $property->images
            ? $property->images->where('is_cover', true)->first()
            : null;

        $coverImage = $cover ? $this->imageUrl($cover) : null;
        $firstImage = $coverImage ?: $images->first();

        return [
            'id' => $property->id,
            'title' => (string) ($property->title ?? ''),
            'description' => (string) ($property->description ?? ''),
            'location' => (string) ($property->location ?? ''),
            'address' => (string) ($property->address ?? ''),
            'latitude' => $property->latitude,
            'longitude' => $property->longitude,

            'price' => (float) ($property->price ?? 0),
            'guests' => (int) ($property->guests ?? 0),
            'bedrooms' => (int) ($property->bedrooms ?? 0),
            'bathrooms' => (int) ($property->bathrooms ?? 0),

            'category_id' => $property->category_id,
            'category' => $property->category,
            'category_name' => $property->category ? $property->category->name : 'Property',

            'rating' => (float) ($property->rating ?? 0),
            'views' => (int) ($property->views ?? 0),
            'bookings' => (int) ($property->bookings ?? 0),
            'earnings' => (float) ($property->earnings ?? 0),

            'image' => $firstImage,
            'images' => $images,
            'image_urls' => $images,

            'status' => $property->status,
            'moderation_status' => $property->moderation_status,
            'display_status' => $property->moderation_status
                ? ucfirst($property->moderation_status)
                : ucfirst($property->status ?? 'pending'),
        ];
    }

    public function dashboard(Request $request)
{
    $clerkId = $request->query('clerk_id');

    if (!$clerkId) {
        return response()->json([
            'success' => false,
            'message' => 'clerk_id required',
        ], 400);
    }

    $user = User::where('clerk_id', $clerkId)->first();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'User not found',
        ], 404);
    }

        $properties = Property::with(['images', 'category'])
            ->where('host_id', $user->id)
            ->get()
            ->map(fn ($property) => $this->formatProperty($property))
            ->values();

        $propertyIds = $properties->pluck('id');

        $reservations = Reservation::with([
                'guest',
                'property.images',
                'property.category',
            ])
            ->whereIn('property_id', $propertyIds)
            ->get();

        $mappedReservations = $reservations->map(function ($reservation) {
            $property = $reservation->property;

            return [
                'id' => $reservation->id,
                'property_id' => $reservation->property_id,
                'property_title' => $property ? $property->title : '',
                'propertyTitle' => $property ? $property->title : '',

                'guest' => $reservation->guest ? [
                    'name' => $reservation->guest->name,
                    'email' => $reservation->guest->email,
                    'phone' => $reservation->guest->phone ?? null,
                    'avatar' => $this->imageUrl($reservation->guest->profile_image),
                ] : [
                    'name' => 'Guest',
                    'email' => null,
                    'phone' => null,
                    'avatar' => null,
                ],

                'check_in' => $reservation->check_in,
                'check_out' => $reservation->check_out,
                'checkIn' => $reservation->check_in,
                'checkOut' => $reservation->check_out,

                'status' => $reservation->status,
                'payment_status' => $reservation->payment_status,
                'total' => (float) ($reservation->total ?? 0),
                'guests' => (int) ($reservation->guests ?? 0),
                'message' => $reservation->message,
                'created_at' => $reservation->created_at,

                'property' => $property ? $this->formatProperty($property) : null,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'properties' => $properties,
                'reservations' => $mappedReservations,
                'stats' => [
                    'totalProperties' => $properties->count(),
                    'totalReservations' => $reservations->count(),
                    'totalEarnings' => $properties->sum('earnings'),
                    'pendingReservations' => $reservations->where('status', 'pending')->count(),
                    'confirmedReservations' => $reservations->where('status', 'confirmed')->count(),
                ],
            ],
        ]);
    }
    public function status(Request $request)
    {
    $clerkId = $request->query('clerk_id');

    if (!$clerkId) {
        return response()->json([
            'success' => false,
            'message' => 'clerk_id required'
        ], 400);
    }

    $user = User::where('clerk_id', $clerkId)->first();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'User not found'
        ], 404);
    }

    $hasProperty = Property::where('host_id', $user->id)->exists();

    return response()->json([
        'success' => true,
        'isHost' => $hasProperty,
        'role' => $user->role
    ]);
    }
}