import {
    Input,
    Directive,
    QueryList,
    ContentChildren,
    AfterViewInit,
    OnDestroy,
  } from '@angular/core';
  import { Subject } from 'rxjs';
  import { takeUntil } from 'rxjs/operators';
import { SyncScrollDirective } from './cdk-scroll.directive';
  
  @Directive({
    selector: '[scrollSyncContainer]',
    standalone: true,
  })
  export class ScrollSyncContainerDirective implements AfterViewInit, OnDestroy {
    @Input() scrollGroups: string[][] = [];
    @Input() syncAxis: 'both' | 'horizontal' | 'vertical' = 'both';
  
    @ContentChildren(SyncScrollDirective, { descendants: true })
    scrollables!: QueryList<SyncScrollDirective>;
  
    private destroy$ = new Subject<void>();
  
    ngAfterViewInit() {
      this.setupScrollSync();
    }
  
    private setupScrollSync() {
      if (!this.scrollables || !this.scrollables.length) {
        return;
      }
  
      // If groups are defined, organize by groups
      if (this.scrollGroups.length > 0) {
        this.setupGroupedScrollSync();
      } else {
        // Otherwise sync all scrollables together
        this.setupScrollSyncForGroup(this.scrollables.toArray());
      }
    }
  
    private setupGroupedScrollSync() {
      // Get all scrollable IDs that are in groups
      const scrollIdsInGroups = this.scrollGroups.flat();
  
      // Get scrollables organized by groups
      this.scrollGroups.forEach(groupIds => {
        const scrollGroup = groupIds
          .map(id => this.scrollables.find(s => s.scrollId === id))
          .filter(s => s) as SyncScrollDirective[];
  
        if (scrollGroup.length > 1) {
          this.setupScrollSyncForGroup(scrollGroup);
        }
      });
  
      // Handle any scrollables not in groups (sync them together)
      const ungroupedScrollables = this.scrollables.filter(
        s => !scrollIdsInGroups.includes(s.scrollId)
      );
  
      if (ungroupedScrollables.length > 1) {
        this.setupScrollSyncForGroup(ungroupedScrollables);
      }
    }
  
    private setupScrollSyncForGroup(scrollGroup: SyncScrollDirective[]) {
      scrollGroup.forEach(scrollable => {
        scrollable.scrolled
          .pipe(takeUntil(this.destroy$))
          .subscribe(({ x, y }) => {
            // Update all other scrollables in this group
            scrollGroup
              .filter(s => s !== scrollable)
              .forEach(s => {
                const point = { x: 0, y: 0 };
  
                // Apply scroll based on sync axis setting
                if (this.syncAxis === 'horizontal') {
                  point.x = x;
                  point.y = s.getCurrentPosition().y; // Keep current Y
                } else if (this.syncAxis === 'vertical') {
                  point.x = s.getCurrentPosition().x; // Keep current X
                  point.y = y;
                } else {
                  // Both axes
                  point.x = x;
                  point.y = y;
                }
  
                s.scrollTo(point);
              });
          });
      });
    }
  
    ngOnDestroy() {
      this.destroy$.next();
      this.destroy$.complete();
    }
  }