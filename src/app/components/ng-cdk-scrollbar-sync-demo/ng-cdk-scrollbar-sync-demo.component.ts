import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CdkScrollable, ScrollDispatcher, ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { ScrollSyncContainerDirective } from '../../directives/cdk-scroll/cdk-scroll-sync.directive';
import { SyncScrollDirective } from '../../directives/cdk-scroll/cdk-scroll.directive';
interface LargeDataItem {
  id: number;
  description: string;
  tags: string[];
  created: Date;
  status: 'Active' | 'Pending' | 'Inactive';
  metrics: {
    value1: number;
    value2: number;
    value3: number;
  };
}
@Component({
  selector: 'app-sync-scroll-demo',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    SyncScrollDirective,
    ScrollSyncContainerDirective,
  ],
  templateUrl: './ng-cdk-scrollbar-sync-demo.component.html',
  styleUrls: ['./ng-cdk-scrollbar-sync-demo.component.less'],
})
export class CdkScrollbarSyncDemoComponent {
  // Basic items for simple lists
  items = Array.from({ length: 50 }).map((_, i) => `Item #${i + 1}`);
  
  // Horizontal items specifically formatted for the horizontal scrolling demo
  horizontalItems = Array.from({ length: 20 }).map((_, i) => `Item #${i + 1}`);
  
  // Table columns and data
  tableColumns = Array.from({ length: 7 }).map((_, i) => `Column ${i + 1}`);
  tableData = Array.from({ length: 8 }, (_, rowIndex) =>
    Array.from({ length: 7 }, (_, colIndex) => `Cell ${rowIndex + 1}-${colIndex + 1}`)
  );

  // Large dataset with complex structure (5000 items)
  largeDataset: LargeDataItem[] = Array.from({ length: 5000 }, (_, i) => {
    const statuses: ('Active' | 'Pending' | 'Inactive')[] = ['Active', 'Pending', 'Inactive'];
    const randomTags = [
      'Technology', 'Finance', 'Healthcare', 'Education', 'Entertainment',
      'Sports', 'Food', 'Travel', 'Fashion', 'Automotive', 'Real Estate'
    ];
    
    // Get 1-3 random tags
    const numTags = Math.floor(Math.random() * 3) + 1;
    const tags: string[] = [];
    for (let j = 0; j < numTags; j++) {
      const randomTag = randomTags[Math.floor(Math.random() * randomTags.length)];
      if (!tags.includes(randomTag)) {
        tags.push(randomTag);
      }
    }
    
    return {
      id: i + 1,
      description: `This is a detailed description for item ${i + 1} with lots of content. It contains information about this particular item's properties.`,
      tags,
      created: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      metrics: {
        value1: Math.floor(Math.random() * 1000),
        value2: Math.floor(Math.random() * 500),
        value3: Math.floor(Math.random() * 100),
      }
    };
  });

  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private viewportRuler: ViewportRuler
  ) {}
  
  ngOnInit() {
    // Use ScrollDispatcher to monitor global scroll events
    this.scrollDispatcher.scrolled().subscribe(() => {
      // This could be used for analytics or performance monitoring
      // console.log('Scroll event detected');
    });
    
    // Use ViewportRuler to monitor viewport size changes
    this.viewportRuler.change().subscribe(() => {
      // This could be used to adjust scroll behavior on resize
      // console.log('Viewport size changed');
    });
  }

  trackByIndex(index: number): number {
    return index;
  }
}