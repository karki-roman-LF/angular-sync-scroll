import {
    Input,
    Output,
    OnInit,
    Directive,
    ElementRef,
    EventEmitter,
    NgZone,
    OnDestroy,
  } from '@angular/core';
  import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
  import { fromEvent, Subject } from 'rxjs';
  import { takeUntil, throttleTime } from 'rxjs/operators';
  
  @Directive({
    selector: '[syncScroll]',
    standalone: true,
    hostDirectives: [CdkScrollable],
  })
  export class SyncScrollDirective implements OnInit, OnDestroy {
    @Input({ required: true }) scrollId!: string;
  
    @Output() scrolled = new EventEmitter<{ x: number; y: number }>();
  
    private destroy$ = new Subject<void>();
  
    constructor(
      private elementRef: ElementRef<HTMLElement>,
      private scrollDispatcher: ScrollDispatcher,
      private ngZone: NgZone
    ) {}
  
    ngOnInit() {
      this.setupScrollListener();
    }
  
    private setupScrollListener() {
      // Listen for scroll events and emit them
      fromEvent(this.elementRef.nativeElement, 'scroll')
        .pipe(
          throttleTime(10), // Throttle for performance
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          const position = this.getCurrentPosition();
          this.scrolled.emit(position);
        });
  
      // Make sure the element is scrollable
      const el = this.elementRef.nativeElement;
      el.style.overflow = 'auto';
    }
  
    public getCurrentPosition() {
      const { scrollLeft, scrollTop } = this.elementRef.nativeElement;
      return {
        x: scrollLeft,
        y: scrollTop,
      };
    }
  
    public scrollTo(point: { x: number; y: number }) {
      const el = this.elementRef.nativeElement;
      el.scrollTop = point.y;
      el.scrollLeft = point.x;
    }
  
    ngOnDestroy() {
      this.destroy$.next();
      this.destroy$.complete();
    }
  }