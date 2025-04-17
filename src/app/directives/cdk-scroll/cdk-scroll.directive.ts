import {
  Input,
  Output,
  OnInit,
  Directive,
  EventEmitter,
  OnDestroy,
  Self,
  NgZone,
  ElementRef,
} from '@angular/core';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';
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
  private isScrolling = false;
  private scrollTimeout: any = null;
  
  constructor(
    @Self() private cdkScrollable: CdkScrollable,
    private scrollDispatcher: ScrollDispatcher,
    private ngZone: NgZone,
    private elementRef: ElementRef
  ) {}
  
  ngOnInit() {
    // Add a data attribute for easier debugging if needed
    this.elementRef.nativeElement.setAttribute('data-scroll-id', this.scrollId);
    this.setupScrollListener();
  }
  
  private setupScrollListener() {
    this.scrollDispatcher
      .scrolled()
      .pipe(
        startWith(null),
        map(() => {
          const scrollOffset = {
            x: this.cdkScrollable.measureScrollOffset('left'),
            y: this.cdkScrollable.measureScrollOffset('top')
          };
          return scrollOffset;
        }),
        distinctUntilChanged((prev, curr) => 
          prev.x === curr.x && prev.y === curr.y
        ),
        throttleTime(5),
        takeUntil(this.destroy$)
      )
      .subscribe(position => {
        // Only emit if this isn't a programmatic scroll
        if (!this.isScrolling) {
          this.scrolled.emit(position);
        }
      });
  }
  
  /**
   * Gets the current scroll position
   */
  public getCurrentPosition(): { x: number; y: number } {
    return {
      x: this.cdkScrollable.measureScrollOffset('left'),
      y: this.cdkScrollable.measureScrollOffset('top')
    };
  }
  
  /**
   * Scrolls to the specified position
   */
  public scrollTo(point: { x: number; y: number }): void {
    // Set flag to avoid event loop
    this.isScrolling = true;

    // Clear any existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.ngZone.runOutsideAngular(() => {
      // Construct the scroll position object dynamically
      const scrollPosition: { left?: number; top?: number } = {};

      if (this.syncAxis === 'horizontal' || this.syncAxis === 'both') {
        scrollPosition.left = point.x;
      }

      if (this.syncAxis === 'vertical' || this.syncAxis === 'both') {
        scrollPosition.top = point.y;
      }

      // Apply the scroll position
      this.cdkScrollable.scrollTo(scrollPosition);

      // Reset the flag after a short delay
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
      }, 50);
    });
  }
  
  ngOnDestroy() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}