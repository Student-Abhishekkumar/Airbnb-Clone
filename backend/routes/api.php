<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\ClerkUserController;
use App\Http\Controllers\Guest\UserProfileController;
use App\Http\Controllers\Property\PropertyController;
use App\Http\Controllers\Api\ExperienceController;
use App\Http\Controllers\Category\CategoryController;
use App\Http\Controllers\Amenity\AmenityController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Host\HostController;
use App\Http\Controllers\Reservation\ReservationController;
use App\Http\Controllers\Guest\WishlistController;
use App\Http\Controllers\Guest\ReviewController;
use App\Http\Controllers\Guest\MessageController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\HelpCenterController;
use App\Http\Controllers\Api\Admin\AdminHelpCenterController;

Route::post('/clerk/sync-user', [ClerkUserController::class, 'sync']);



// Additional property endpoints
Route::get('/properties/destinations', [PropertyController::class, 'destinations']);

// Pages routes
Route::apiResource('properties', PropertyController::class);
Route::apiResource('experiences', ExperienceController::class);
Route::apiResource('services', ServiceController::class);
Route::post('/properties', [PropertyController::class, 'store']);

// category and amenity routes
Route::get('/categories/property', [CategoryController::class, 'property']);
Route::get('/categories/experience', [CategoryController::class, 'experience']);
Route::get('/amenities', [AmenityController::class, 'index']);

// Host routes
Route::get('/host/dashboard', [HostController::class, 'dashboard']);
Route::get('/host/properties/{id}/edit', [PropertyController::class, 'showForEdit']);
Route::get('/host/properties/{id}', [PropertyController::class, 'show']);
Route::get('/host/status', [HostController::class,'status']);

// Reservation & Trip routes
Route::post('/reservations', [ReservationController::class, 'store']);
Route::get('/reservations/{id}', [ReservationController::class, 'show']);
Route::patch('/reservations/{id}/status', [ReservationController::class, 'updateStatus']);
Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);
Route::patch('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);
Route::get('/trips', [ReservationController::class, 'guestTrips']);

// Wishlist routes
Route::get('/wishlist', [WishlistController::class, 'index']);
Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);
Route::get('/wishlist/check', [WishlistController::class, 'check']);

// Review routes
Route::get('/properties/{propertyId}/reviews', [ReviewController::class, 'index']);
Route::post('/properties/{propertyId}/reviews', [ReviewController::class, 'store']);

// Message routes
Route::get('/messages/inbox', [MessageController::class, 'inbox']);
Route::get('/messages/unread', [MessageController::class, 'unreadCount']);
Route::get('/messages/thread/{partnerId}', [MessageController::class, 'thread']);
Route::post('/messages/send', [MessageController::class, 'send']);

// Admin routes
Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
Route::get('/admin/current-user', [AdminController::class, 'currentUser']);
Route::get('/admin/users', [AdminController::class, 'users']);
Route::patch('/admin/users/{id}/role', [AdminController::class, 'updateUserRole']);
Route::patch('/admin/users/{id}/status', [AdminController::class, 'updateUserStatus']);
Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);
Route::get('/admin/properties', [AdminController::class, 'properties']);
Route::post('/admin/properties/{id}/approve', [AdminController::class, 'approveProperty']);
Route::post('/admin/properties/{id}/reject', [AdminController::class, 'rejectProperty']);
Route::get('/admin/categories', [AdminController::class, 'categories']);
Route::post('/admin/categories', [AdminController::class, 'storeCategory']);
Route::put('/admin/categories/{id}', [AdminController::class, 'updateCategory']);
Route::delete('/admin/categories/{id}', [AdminController::class, 'deleteCategory']);
Route::patch('/admin/categories/{id}/toggle', [AdminController::class, 'toggleCategory']);
Route::get('/admin/reservations', [AdminController::class, 'reservations']);
Route::get('/admin/analytics', [AdminController::class, 'analytics']);
Route::get('/admin/notifications', [AdminController::class, 'notifications']);
Route::post('/admin/notifications/send', [AdminController::class, 'sendNotification']);

// User Profile routes
Route::get('/user/profile', [UserProfileController::class, 'show']);
Route::put('/user/profile', [UserProfileController::class, 'update']);
Route::post('/user/profile/photo', [UserProfileController::class, 'uploadPhoto']);
Route::delete('/user/profile/photo', [UserProfileController::class, 'deletePhoto']);

// Public Endpoints 
Route::prefix('help-center')->group(function () {
    Route::get('/search', [HelpCenterController::class, 'search']);
    Route::get('/top-articles', [HelpCenterController::class, 'getTopArticles']);
    Route::get('/guides', [HelpCenterController::class, 'getGuides']);
    Route::get('/explore', [HelpCenterController::class, 'getExploreMore']);
    Route::get('/article/{id}',[HelpCenterController::class, 'show']);
    Route::get('/all-topics', [HelpCenterController::class, 'getAllTopics']);
    Route::get('/topic/{id}', [HelpCenterController::class, 'showTopic']);
});
// Admin CMS Endpoints 
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::apiResource('help-content', AdminHelpCenterController::class);
});
// Notification routes
Route::get('/notifications', [NotificationController::class, 'index']);
Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
