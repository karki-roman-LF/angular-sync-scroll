import {
  Input,
  Directive,
  QueryList,
  ContentChildren,
  AfterViewInit,
  OnDestroy,
  OnInit,
  NgZone,
} from '@angular/core';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { Subject, merge, Observable } from 'rxjs';
import { takeUntil, throttleTime, filter, map } from 'rxjs/operators';
import { SyncScrollDirective } from './cdk-scroll.directive';

@Directive({
  selector: '[scrollSyncContainer]',
  standalone: true,
})
export class ScrollSyncContainerDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input() scrollGroups: string[][] = [];
  @Input() syncAxis: 'both' | 'horizontal' | 'vertical' = 'both';
  
  // Find all sync scroll directives within this container
  @ContentChildren(SyncScrollDirective, { descendants: true })
  scrollables!: QueryList<SyncScrollDirective>;
  
  private destroy$ = new Subject<void>();
  private scrollableMap = new Map<string, SyncScrollDirective>();
  
  constructor(
    private scrollDispatcher: ScrollDispatcher,
    private ngZone: NgZone
  ) {}
  
  ngOnInit() {
    // Optional: Use ScrollDispatcher for global monitoring if needed
    this.setupGlobalScrollListener();
  }
  
  ngAfterViewInit() {
    // Setup scroll synchronization
    this.setupScrollSync();
    
    // Re-setup if the scrollables change
    this.scrollables.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.buildScrollableMap();
        this.setupScrollSync();
      });
      
    // Initial map build
    this.buildScrollableMap();
  }
  
  /**
   * Creates a map of scrollId -> directive instance for faster lookups
   */
  private buildScrollableMap() {
    this.scrollableMap.clear();
    this.scrollables.forEach(scrollable => {
      this.scrollableMap.set(scrollable.scrollId, scrollable);
    });
  }
  
  /**
   * Uses ScrollDispatcher to track all scrolling in the application
   * This can be useful for performance monitoring or global scroll behavior
   */
  private setupGlobalScrollListener() {
    this.scrollDispatcher.scrolled()
      .pipe(
        throttleTime(50), // Less frequent than individual tracking
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Here you could add global scroll handling if needed
      });
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
    
    // Set up each group
    this.scrollGroups.forEach(groupIds => {
      // Find the scrollable directives for this group
      const scrollGroup = groupIds
        .map(id => this.scrollableMap.get(id))
        .filter(Boolean) as SyncScrollDirective[];
      
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
    // Create an array of scroll observables from all scrollables in the group
    const scrollObservables: Observable<{
      source: SyncScrollDirective;
      position: { x: number; y: number };
    }>[] = scrollGroup.map(scrollable => 
      scrollable.scrolled.pipe(
        // Add the source information to each emission
        map(position => ({ source: scrollable, position }))
      )
    );
    
    // Merge all scroll observables into a single stream
    merge(...scrollObservables)
      .pipe(
        // Avoid excessive updates
        throttleTime(5), // Reduced from 10ms to 5ms for more responsive synchronization
        // Only continue until this directive is destroyed
        takeUntil(this.destroy$)
      )
      .subscribe(({ source, position }) => {
        // Log for debugging
        // console.log(`Scroll from ${source.scrollId}:`, position);
        
        // Synchronize all other scrollables in this group
        this.synchronizeGroup(scrollGroup, source, position);
      });
  }
  
  /**
   * Syncs all scrollables in a group based on one that triggered a scroll
   */
  private synchronizeGroup(
    group: SyncScrollDirective[],
    source: SyncScrollDirective,
    position: { x: number; y: number }
  ) {
    // Run outside Angular's change detection to avoid cascading change detection cycles
    this.ngZone.runOutsideAngular(() => {
      group
        .filter(scrollable => scrollable !== source)
        .forEach(scrollable => {
          const currentPos = scrollable.getCurrentPosition();
          const newPos = { x: currentPos.x, y: currentPos.y };
          
          // Update position based on sync axis
          if (this.syncAxis === 'horizontal' || this.syncAxis === 'both') {
            newPos.x = position.x;
          }
          
          if (this.syncAxis === 'vertical' || this.syncAxis === 'both') {
            newPos.y = position.y;
          }
          
          // Set syncAxis on each scrollable to match container's setting
          scrollable.syncAxis = this.syncAxis;
          
          // Apply the new scroll position
          scrollable.scrollTo(newPos);
        });
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}