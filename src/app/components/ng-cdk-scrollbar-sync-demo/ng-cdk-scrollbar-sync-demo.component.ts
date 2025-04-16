import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ScrollDispatcher, ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { ScrollSyncContainerDirective } from '../../directives/cdk-scroll/cdk-scroll-sync.directive';
import { SyncScrollDirective } from '../../directives/cdk-scroll/cdk-scroll.directive';

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
export class CdkScrollbarSyncDemoComponent implements OnInit {
  // Basic items for simple lists
  items = Array.from({ length: 50 }).map((_, i) => `Item #${i + 1}`);
  
  // Horizontal items specifically formatted for the horizontal scrolling demo
  horizontalItems = Array.from({ length: 20 }).map((_, i) => `Item #${i + 1}`);
  
  // Table columns and data
  tableColumns = Array.from({ length: 7 }).map((_, i) => `Column ${i + 1}`);
  tableData = Array.from({ length: 8 }, (_, rowIndex) =>
    Array.from({ length: 7 }, (_, colIndex) => `Cell ${rowIndex + 1}-${colIndex + 1}`)
  );
  
  // Define scroll groups explicitly - important for the multiple groups demo
  scrollGroups = [
    ['group-a-1', 'group-a-2'], 
    ['group-b-1', 'group-b-2']
  ];

  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private viewportRuler: ViewportRuler
  ) {}
  
  ngOnInit() {
    // Use ScrollDispatcher to monitor global scroll events
    this.scrollDispatcher.scrolled().subscribe(() => {
      // This could be used for analytics or performance monitoring
    });
    
    // Use ViewportRuler to monitor viewport size changes
    this.viewportRuler.change().subscribe(() => {
      // This could be used to adjust scroll behavior on resize
    });
  }

  trackByIndex(index: number): number {
    return index;
  }
}