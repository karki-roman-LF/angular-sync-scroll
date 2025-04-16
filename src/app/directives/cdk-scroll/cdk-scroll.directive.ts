import {
  Input,
  Output,
  OnInit,
  Directive,
  EventEmitter,
  OnDestroy,
  Self,
  NgZone,
} from '@angular/core';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { Observable, Subject } from 'rxjs';
import { takeUntil, throttleTime, startWith, map, distinctUntilChanged } from 'rxjs/operators';

@Directive({
  selector: '[syncScroll]',
  standalone: true,
  // Add CdkScrollable as a host directive
  hostDirectives: [CdkScrollable],
})
export class SyncScrollDirective implements OnInit, OnDestroy {
  @Input({ required: true }) scrollId!: string;
  @Input() syncAxis: 'both' | 'horizontal' | 'vertical' = 'both';
  
  // Emitter for scroll position changes
  @Output() scrolled = new EventEmitter<{ x: number; y: number }>();
  
  private destroy$ = new Subject<void>();
  
  constructor(
    // Inject the CdkScrollable that is host-injected into this directive
    @Self() private cdkScrollable: CdkScrollable,
    // Use ScrollDispatcher to track scroll events globally
    private scrollDispatcher: ScrollDispatcher,
    private ngZone: NgZone
  ) {}
  
  ngOnInit() {
    this.setupScrollListener();
  }
  
  private setupScrollListener() {
    // This observable tracks scroll events for this specific scrollable element
    this.scrollDispatcher
      .scrolled()
      .pipe(
        // Start by emitting once to capture initial scroll position
        startWith(null),
        // Filter to only get events from this specific scrollable
        map(() => {
          // Check if this is the scrollable that triggered the event
          const scrollOffset = {
            x: this.cdkScrollable.measureScrollOffset('left'),
            y: this.cdkScrollable.measureScrollOffset('top')
          };
          return scrollOffset;
        }),
        // Only emit when the position actually changes
        distinctUntilChanged((prev, curr) => 
          prev.x === curr.x && prev.y === curr.y
        ),
        // Throttle for performance (reduced for more responsiveness)
        throttleTime(5),
        // Cleanup subscription on directive destroy
        takeUntil(this.destroy$)
      )
      .subscribe(position => {
        // Emit the scroll position
        this.scrolled.emit(position);
      });
  }
  
  /**
   * Gets the current scroll position using CdkScrollable
   */
  public getCurrentPosition(): { x: number; y: number } {
    return {
      x: this.cdkScrollable.measureScrollOffset('left'),
      y: this.cdkScrollable.measureScrollOffset('top')
    };
  }
  
  /**
   * Scrolls to the specified position using CdkScrollable
   */
  public scrollTo(point: { x: number; y: number }): void {
    // Run outside Angular's change detection to avoid unnecessary cycles
    this.ngZone.runOutsideAngular(() => {
      // Apply scrolling based on sync axis
      if (this.syncAxis === 'horizontal' || this.syncAxis === 'both') {
        this.cdkScrollable.scrollTo({
          left: point.x
        });
      }
      
      if (this.syncAxis === 'vertical' || this.syncAxis === 'both') {
        this.cdkScrollable.scrollTo({
          top: point.y
        });
      }
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}