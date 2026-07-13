<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HelpCenterContent;
use Illuminate\Support\Facades\DB;

class HelpCenterSeeder extends Seeder
{
    public function run(): void
    {
        $universalSections = [
            'Your account' => ['Setting up your account', 'Identity verification', 'Managing your account', 'Account security'],
            'Reviews' => ['Review basics for everyone', 'Understanding reviews as a host', 'Reviewing your host', 'After a review is submitted'],
            'Safety' => [ 'Safety concerns', 'Safety tips and guidelines', 'Reporting issues', 'Accessibility and inclusion' ],
            'About StayFinder' => [ 'Getting started', 'How StayFinder works', 'Our community policies', 'Partnerships', 'Contact info and feedback' ]
        ];

        $tabSpecificStructure = [
            'Guest' => [
                'Searching and booking' => [
                    'Search tips', 'Booking places to stay', 'Booking StayFinder Experiences', 
                    'Booking StayFinder Services', 'Booking for someone else',
                ],
                'Your reservations as a guest' => [
                    'Reservation status', 'Changes as a guest', 'Cancellations', 'Checking in', 
                    'Checking out', 'Issues with your reservation'
                ],
                'Payments and pricing' => [
                    'Paying for a reservation', 'Guest refunds and reimbursements', 'Pricing and fees', 
                    'Invoices and receipts', 'Taxes for guests'
                ],
            ],
            
            'Home host' => [
                'About hosting homes' => [
                    'Preparing to host a home', 'Protection and insurance', 'Hosting regulations and standards', 'StayFinder Luxe'
                ],
                'Calendar and bookings' => [
                    'Booking enquiries', 'Your booking requirements', 'Managing your calendar', 'Pre-approvals and special offers'
                ],
                'Payouts and taxes' => [
                    'Donations', 'Payouts for home hosts', 'Taxes for hosts'
                ],
                'Managing your home listing' => [
                    'Listing details', 'Pricing your home', 'Listing availability', 'Booking settings and Instant Book'
                ],
                'Your reservations as a home host' => [
                    'How reservations work', 'Cancellations', 'Changes as a home host', 
                    'Guest refunds and reimbursements', 'Messaging your guests'
                ],
                'Local rules and regulations' => [
                    'Asia-Pacific', 'Europe', 'North America', 'South America', 'Africa'
                ],
            ],

            'Experience host' => [
                'About hosting experiences' => [
                    'Preparing to host an experience', 'Experience categories', 
                    'Co-hosting experiences',
                ],
                'Managing your experience' => [
                    'Calendar and bookings', 'Updating your experience page', 'Pricing your experience', 'Marketing and promoting your experience'
                ],
                'Your reservations as an experience host' => [
                    'Changes and cancellations', 'Refunds and reimbursements', 'Communicating with guests', 'Issues with a reservation'
                ],
                'Payouts and taxes for experiences' => [
                    'Payouts', 'Taxes for hosts'
                ],
                'Local rules and regulations for Experiences' => [
                    'General info', 'Asia-Pacific'
                ],
            ],

            'Service host' => [
                'About hosting services' => [
                    'Service hosting basics', 'Preparing to host a service', 'Protection and insurance', 'Service categories and guidelines'
                ],
                'Managing your service' => [
                    'Calendar and bookings', 'Updating your service page', 'Pricing your service'
                ],
                'Your reservations as a service host' => [
                    'Changes and cancellations', 'Refunds and reimbursements', 'Communicating with guests', 'Issues with a reservation'
                ],
                'Payouts and taxes for services' => [
                    'Payouts', 'Taxes for hosts'
                ],
                'Local rules and regulations for Services' => [
                    'General info', 'Service categories and guidelines'
                ],
            ],

            'Travel admin' => [
                'StayFinder for Work' => [
                    'StayFinder for Work basics', 'Signing up for StayFinder for Work', 'Your company account', 
                    'Managing employees', 'Using the dashboard', 'Account settings'
                ],
                'Booking and reservations' => [
                    'Booking travel for employees', 'Managing reservations for employees'
                ],
                'Billing and receipts' => [
                    'Centralized billing', 'Invoices and receipts'
                ],
            ]
        ];

        $createdTopics = [];
        foreach ($tabSpecificStructure as $tabCategory => $sections) {
            $completeTabSections = array_merge($sections, $universalSections);
            foreach ($completeTabSections as $sectionHeading => $topics) {
                foreach ($topics as $topicTitle) {
                    $lookupKey = "{$tabCategory}::{$topicTitle}";
                    
                    $createdTopics[$lookupKey] = HelpCenterContent::create([
                        'parent_id'       => null,
                        'content_type'    => 'topic',
                        'tab_category'    => $tabCategory,
                        'section_heading' => $sectionHeading,
                        'title'           => $topicTitle,
                        'summary'         => "Browse helpful guides and articles regarding {$topicTitle}.",
                        'intro'           => "Everything you need to know about {$topicTitle} on StayFinder.",
                        'is_published'    => true,
                    ]);
                }
            }
        }

        $this->command->info('Successfully generated all deduplicated Tier 1 topics across 5 tabs!');

    }
}