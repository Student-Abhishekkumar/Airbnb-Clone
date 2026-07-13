<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HelpCenterContent extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'parent_id',
        'content_type',
        'tab_category',
        'section_heading',
        'title',
        'summary',
        'intro',
        'image',
        'url',
        'body_content',
        'content_sections',
        'related_articles',
        'related_topics',
        'is_published'
    ];

    protected $casts = [
        'content_sections' => 'array',
        'related_articles' => 'array',
        'related_topics' => 'array',
        'is_published' => 'boolean',
    ];

    protected $appends = ['tag', 'breadcrumbs'];

    public function getTagAttribute()
    {
        $typeMap = [
            'article'     => 'How-to',
            'top_article' => 'How-to',
            'guide'       => 'Guide'
        ];

        $friendlyType = $typeMap[$this->content_type] ?? ucfirst($this->content_type);
        return "{$friendlyType} • {$this->tab_category}";
    }

    public function getBreadcrumbsAttribute()
    {
        $crumbs = [];

        if ($this->content_type === 'topic') {
            $crumbs[] = ['id' => 'home', 'label' => 'Home', 'url' => '/help'];
            $crumbs[] = ['id' => 'all', 'label' => 'All topics', 'url' => '/help/all-topics'];
            
            if ($this->section_heading) {
                $crumbs[] = ['id' => 'p-sec', 'label' => $this->section_heading, 'url' => '/help/all-topics'];
            }
            $crumbs[] = ['id' => 'curr', 'label' => $this->title, 'url' => '#'];
            
        } else{
            // Format for ArticleDetails.jsx (Array of Objects with URLs)
            $crumbs[] = ['id' => 'home', 'label' => 'Home', 'url' => '/help'];
            $crumbs[] = ['id' => 'all', 'label' => 'All topics', 'url' => '/help/all-topics'];
            
            // If the article is linked to a Parent Topic, get the parent's data first
            if ($this->parent_id && $this->parent) {
                
                // 1. Parent's Directory Section (e.g., "Your reservations as a guest")
                if ($this->parent->section_heading) {
                    $crumbs[] = ['id' => 'p-sec', 'label' => $this->parent->section_heading, 'url' => '/help/all-topics'];
                }
                
                // 2. Parent's Title (e.g., "Cancellations") -> Links back to the Topic page!
                $crumbs[] = ['id' => 'p-title', 'label' => $this->parent->title, 'url' => '/help/topic/' . $this->parent_id];
            }

            // 3. Current Article's Section (e.g., "Cancelling a reservation")
            if ($this->section_heading) {
                $topicUrl = $this->parent_id ? '/help/topic/' . $this->parent_id : '/help/all-topics';
                $crumbs[] = ['id' => 'a-sec', 'label' => $this->section_heading, 'url' => $topicUrl];
            }

            // 4. Current Article's Title -> Added back so it shows up on the screen!
            $crumbs[] = ['id' => 'curr', 'label' => $this->title, 'url' => '#'];
        }

        return $crumbs;
    }

    public function getUrlAttribute($value)
    {
        if (in_array($this->content_type, ['article', 'top_article', 'guide'])) {
            return "/help/article/" . $this->id;
        }

        if ($this->content_type === 'topic') {
            return "/help/topic/" . $this->id;
        }

        return $value ?: '#';
    }

    public function parent()
    {
        return $this->belongsTo(HelpCenterContent::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(HelpCenterContent::class, 'parent_id');
    }
}