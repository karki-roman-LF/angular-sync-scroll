import {
  Input,
  OnInit,
  Directive,
  QueryList,
  ContentChildren,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
  AfterContentInit,
} from '@angular/core';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { Subject, merge, Observable } from 'rxjs';
import { takeUntil, throttleTime, map, tap } from 'rxjs/operators';
import { SyncScrollDirective } from './cdk-scroll.directive';

@Directive({
  selector: '[scrollSyncContainer]',
  standalone: true,
})
export class ScrollSyncContainerDirective implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
  @Input() scrollGroups: string[][] = [];
  @Input() syncAxis: 'both' | 'horizontal' | 'vertical' = 'both';
  
  @ContentChildren(SyncScrollDirective, { descendants: true })
  scrollables!: QueryList<SyncScrollDirective>;
  
  private destroy$ = new Subject<void>();
  private scrollableMap = new Map<string, SyncScrollDirective>();
  private activeScrollers = new Set<string>();
  private groupMappings: Map<string, string[]> = new Map();
  
  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.setupGlobalScrollListener();
  }
  
  ngAfterContentInit() {
    // Initial setup right after content is initialized
    setTimeout(() => {
      this.buildScrollableMap();
      this.buildGroupMappings();
    });
  }
  
  ngAfterViewInit() {
    // Setup scroll synchronization
    setTimeout(() => {
      this.setupScrollSync();
    });
    
    // Re-setup if the scrollables change
    this.scrollables.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => {
          this.buildScrollableMap();
          this.buildGroupMappings();
          this.setupScrollSync();
        });
      });
  }
  
  /**
   * Create a map of scrollId -> directive instance for faster lookups
   */
  private buildScrollableMap() {
    this.scrollableMap.clear();
    
    if (this.scrollables && this.scrollables.length > 0) {
      this.scrollables.forEach(scrollable => {
        if (scrollable && scrollable.scrollId) {
          this.scrollableMap.set(scrollable.scrollId, scrollable);
        }
      });
    }
  }
  
  /**
   * Build a mapping of scrollable ID to its group for quick lookup
   */
  private buildGroupMappings() {
    this.groupMappings.clear();
    
    // If specific groups are defined
    if (this.scrollGroups && this.scrollGroups.length > 0) {
      // Map each scrollable to its group
      this.scrollGroups.forEach((group, index) => {
        group.forEach(scrollId => {
          this.groupMappings.set(scrollId, group);
        });
      });
      
      // Handle ungrouped scrollables
      const groupedIds = this.scrollGroups.flat();
      const allIds = Array.from(this.scrollableMap.keys());
      const ungroupedIds = allIds.filter(id => !groupedIds.includes(id));
      
      if (ungroupedIds.length > 1) {
        // Create an automatic group for ungrouped scrollables
        ungroupedIds.forEach(id => {
          this.groupMappings.set(id, ungroupedIds);
        });
      }
    } else {
      // If no groups defined, all scrollables are in one group
      const allIds = Array.from(this.scrollableMap.keys());
      allIds.forEach(id => {
        this.groupMappings.set(id, allIds);
      });
    }
  }
  
  /**
   * Uses ScrollDispatcher to track all scrolling in the application
   */
  private setupGlobalScrollListener() {
    this.scrollDispatcher.scrolled()
      .pipe(
        throttleTime(50),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Global scroll handling if needed
      });
  }
  
  private setupScrollSync() {
    if (!this.scrollables || this.scrollables.length <= 1) {
      return;
    }
    
    const scrollObservables: Observable<{
      source: SyncScrollDirective;
      position: { x: number; y: number };
    }>[] = [];
    
    // Create observables for all scrollables
    this.scrollables.forEach(scrollable => {
      const obs = scrollable.scrolled.pipe(
        map(position => ({ source: scrollable, position })),
        tap(data => {
          // Process scroll event from this source
          this.handleScrollEvent(data.source, data.position);
        })
      );
      
      scrollObservables.push(obs);
    });
    
    // Merge all scroll observables
    merge(...scrollObservables)
      .pipe(
        throttleTime(5),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
  
  /**
   * Process a scroll event from a source scrollable
   */
  private handleScrollEvent(source: SyncScrollDirective, position: { x: number; y: number }) {
    if (!source || !source.scrollId) {
      return;
    }
    
    // Get the group this scrollable belongs to
    const sourceGroup = this.groupMappings.get(source.scrollId);
    
    if (!sourceGroup) {
      return;
    }
    
    // Add the source to active scrollers to prevent infinite loops
    this.activeScrollers.add(source.scrollId);
    
    // Run outside Angular's change detection
    this.ngZone.runOutsideAngular(() => {
      // Only sync scrollables in the same group
      sourceGroup.forEach(targetId => {
        if (targetId !== source.scrollId && !this.activeScrollers.has(targetId)) {
          const target = this.scrollableMap.get(targetId);
          
          if (target) {
            const currentPos = target.getCurrentPosition();
            const newPos = { x: currentPos.x, y: currentPos.y };
            
            // Apply scroll position based on sync axis
            if (this.syncAxis === 'horizontal' || this.syncAxis === 'both') {
              newPos.x = position.x;
            }
            
            if (this.syncAxis === 'vertical' || this.syncAxis === 'both') {
              newPos.y = position.y;
            }
            
            // Set the sync axis on the target
            target.syncAxis = this.syncAxis;
            
            // Apply scroll
            target.scrollTo(newPos);
          }
        }
      });
      
      // Remove the source from active scrollers after a short delay
      setTimeout(() => {
        this.activeScrollers.delete(source.scrollId);
      }, 50);
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}