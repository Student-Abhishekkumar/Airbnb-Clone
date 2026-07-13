<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HelpCenterContent;

class HelpCenterController extends Controller
{
    public function getTopArticles(Request $request)
    {
        $category = $request->query('category', 'Guest');

        $articles = HelpCenterContent::whereIn('content_type', ['article', 'top_article'])
            ->where('tab_category', 'LIKE', "%{$category}%")
            ->where('tab_category', '!=', 'Universal') 
            ->where('is_published', true)
            ->where(function ($query) {
                $query->whereNotNull('content_sections')
                      ->where('content_sections', '!=', '[]')
                      ->where('content_sections', '!=', 'null')
                      ->orWhereNotNull('body_content');
            })
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($item) {
                $item->url = "/help/article/{$item->id}";
                return $item;
            });

        return response()->json($articles);
    }

    public function getGuides(Request $request)
    {
        $category = $request->query('category', 'Guest');

        $guides = HelpCenterContent::where('content_type', 'guide')
            ->whereIn('tab_category', [$category, 'Universal'])
            ->where('is_published', true)
            ->where(function ($query) {
                $query->whereNotNull('content_sections')
                        ->where('content_sections', '!=', '[]')
                        ->where('content_sections', '!=', 'null')
                        ->orWhereNotNull('body_content');
            })
            ->latest()
            ->get()
            ->map(function ($item) {
                $item->url = "/help/article/{$item->id}";
                if (!empty($item->image)) {
                    $decodedImages = json_decode($item->image, true);
                    $imageArray = is_array($decodedImages) ? $decodedImages : [$item->image];
                    $firstImageString = $imageArray[0] ?? null;
                    $item->images = $imageArray;         
                    $item->photos = $imageArray;         
                    $item->image = $firstImageString;    
                    $item->imageSrc = $firstImageString; 
                    $item->image_url = $firstImageString;
                }
                $item->price = null; 
                $item->price_per_night = null;
                
                return $item;
            });

        return response()->json($guides);
    }

    public function getExploreMore()
    {
        $promotions = HelpCenterContent::where('is_published', true)
            ->whereRaw("FIND_IN_SET('explore_promo', content_type)")
            ->latest()
            ->take(2)
            ->get()
            ->map(function ($item) {
                $item->url = $item->url ?: "/help/topic/{$item->id}";
                if (!empty($item->image)) {
                    $decodedImages = json_decode($item->image, true);
                    $imageArray = is_array($decodedImages) ? $decodedImages : [$item->image];
                    $firstImageString = $imageArray[0] ?? null;

                    $item->images = $imageArray;
                    $item->photos = $imageArray;
                    $item->image = $firstImageString;
                    $item->imageSrc = $firstImageString;
                    $item->image_url = $firstImageString;
                }
                $item->price = null; 
                $item->price_per_night = null;
                return $item;
            });
            
        return response()->json($promotions);
    }
    
    public function getAllTopics(Request $request)
    {
        $requestedTab = $request->query('tab', 'Guest');
        $topics = HelpCenterContent::whereIn('tab_category',[$requestedTab, 'Universal'])
            ->whereNull('parent_id') 
            ->where('content_type', 'topic')
            ->where('is_published', true)
            ->orderByRaw("FIELD(tab_category, ?, 'Universal')", [$requestedTab])
            ->orderBy('id', 'asc')
            ->get();

        $groupedTopics = $topics->groupBy('section_heading')->map(function ($items) {
            return $items->map(function ($item) {
                return [
                    'id'    => $item->id,
                    'title' => $item->title,
                    'tab_category' => $item->tab_category,
                    'url'   => $item->url ?: "/help/topic/{$item->id}",
                ];
            });
        });

        return response()->json([
            'success' => true,
            'data'    => $groupedTopics
        ], 200);
    }

    public function show($id)
    {
        $article = HelpCenterContent::findOrFail($id);
        $payload = $article->toArray();
        $payload['sections'] = $article->content_sections ?? [];
        $payload['relatedArticles'] = $article->related_articles ?? [];
        $payload['category'] = $article->tag ?: $article->tab_category;

        return response()->json($payload, 200);
    }

public function showTopic($id)
    {
        $topic = HelpCenterContent::where('id', $id)
            ->where('content_type', 'topic')
            ->firstOrFail();

        if (!empty($topic->content_sections)) {
            $sectionsFormatted = $topic->content_sections;
        } else {
            $articles = HelpCenterContent::where('parent_id', $id)
                ->whereIn('content_type', ['article', 'top_article', 'guide'])
                ->where('is_published', true)
                ->get();

            $groupedArticles = $articles->groupBy('section_heading');

            $sectionsFormatted = [];
            foreach ($groupedArticles as $sectionName => $sectionArticles) {
                $articlesArray = $sectionArticles->map(function($article) {
                    return [
                        'id'      => $article->id,
                        'tag'     => $article->tag ?: 'Article', 
                        'title'   => $article->title,
                        'summary' => $article->summary,
                        'url'     => "/help/article/{$article->id}", 
                    ];
                });

                $sectionsFormatted[] = [
                    'id'       => 'sec-' . md5($sectionName), 
                    'title'    => $sectionName ?: 'General Articles', 
                    'articles' => $articlesArray
                ];
            }
        }

        $payload = [
            'pageTitle'     => $topic->title,
            'pageSummary'   => $topic->summary,
            'breadcrumbs'   => $topic->breadcrumbs ?? [],
            'sections'      => $sectionsFormatted,
            'relatedTopics' => $topic->related_topics ?? [] 
        ];
        return response()->json(array_merge($payload, ['data' => $payload]), 200);
    }
    public function search(Request $request)
    {
        $searchTerm = $request->input('q');

        if (empty($searchTerm)) {
            return response()->json(['data' => []], 200);
        }

        $results = HelpCenterContent::where(function($query) use ($searchTerm) {
                $query->where('title', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('summary', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('intro', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('body_content', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('content_sections', 'LIKE', "%{$searchTerm}%") 
                      ->orWhere('tab_category', 'LIKE', "%{$searchTerm}%");
            })
            ->whereIn('content_type', ['article', 'top_article', 'guide'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $results
        ], 200);
    }
}
