import {
  Directive,
  Input,
  ContentChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  NgZone,
  DestroyRef,
  inject,
  OnDestroy
} from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

/**
 * Directive to synchronize scrolling between multiple scrollable elements
 * Usage: Add appCdkScrollSync to a parent container and cdk-scrollable to child elements
 * Optional: Set [syncAxis]="'horizontal'|'vertical'|'both'"
 * Optional: Group scrollables with [scrollGroup]="[['id1', 'id2'], ['id3', 'id4']]"
 */
@Directive({
  selector: '[appCdkScrollSync]',
  standalone: true
})
export class CdkScrollSyncDirective implements AfterViewInit, OnDestroy {
  @Input() scrollGroup: string[][] = [];
  @Input() syncAxis: 'both' | 'horizontal' | 'vertical' = 'both';

  @ContentChildren(CdkScrollable, { descendants: true })
  scrollables!: QueryList<CdkScrollable>;

  private destroyRef = inject(DestroyRef);
  private scrollingElement: ElementRef | null = null;
  private isScrolling = false;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    // Wait for next tick to ensure scrollables are available
    setTimeout(() => {
      this.setupScrollSync();
    });

    // Listen for changes to scrollables
    this.scrollables.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.setupScrollSync();
      });
  }

  ngOnDestroy(): void {
    // Cleanup handled by takeUntilDestroyed
  }

  private setupScrollSync(): void {
    if (!this.scrollables?.length) {
      return;
    }

    // Group the scrollables based on IDs or use all as one group
    const groupedScrollables = this.getGroupedScrollables();

    // Set up scroll listeners for each group
    groupedScrollables.forEach(group => {
      if (group.length > 1) {
        this.setupScrollListenersForGroup(group);
      }
    });
  }

  private getGroupedScrollables(): CdkScrollable[][] {
    // If no groups specified, use all scrollables as one group
    if (!this.scrollGroup.length) {
      return [this.scrollables.toArray()];
    }

    // Get all IDs in groups
    const idsInGroups = this.scrollGroup.flat();
    
    // Get scrollables without group assignment
    const scrollablesWithoutGroup = this.scrollables.filter(
      scrollable => !idsInGroups.includes(scrollable.getElementRef().nativeElement.id)
    );

    // Create groups based on defined IDs
    const scrollableGroups = this.scrollGroup.map(groupIds => 
      groupIds
        .map(id => this.scrollables.find(
          scrollable => scrollable.getElementRef().nativeElement.id === id
        ))
        .filter((item): item is CdkScrollable => !!item)
    ).filter(group => group.length > 0);

    // Add the non-grouped scrollables as a separate group if they exist
    if (scrollablesWithoutGroup.length > 0) {
      scrollableGroups.push(scrollablesWithoutGroup);
    }

    return scrollableGroups;
  }

  private setupScrollListenersForGroup(scrollables: CdkScrollable[]): void {
    scrollables.forEach(scrollable => {
      const element = scrollable.getElementRef().nativeElement;

      // Use fromEvent for better performance with throttle
      fromEvent(element, 'scroll')
        .pipe(
          throttleTime(10), // Throttle to improve performance
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          // Prevent infinite scroll loops
          if (this.isScrolling || this.scrollingElement?.nativeElement === element) {
            return;
          }

          this.scrollingElement = scrollable.getElementRef();
          this.isScrolling = true;

          // Get current scroll position
          const scrollLeft = element.scrollLeft;
          const scrollTop = element.scrollTop;

          // Sync scroll position to other elements in the same group
          this.ngZone.runOutsideAngular(() => {
            scrollables
              .filter(s => s.getElementRef().nativeElement !== element)
              .forEach(s => {
                const targetElement = s.getElementRef().nativeElement;
                
                // Apply scroll based on the syncAxis setting
                if (this.syncAxis === 'horizontal' || this.syncAxis === 'both') {
                  targetElement.scrollLeft = scrollLeft;
                }
                
                if (this.syncAxis === 'vertical' || this.syncAxis === 'both') {
                  targetElement.scrollTop = scrollTop;
                }
              });

            // Reset after a small delay to allow for other scroll events
            setTimeout(() => {
              this.isScrolling = false;
              this.scrollingElement = null;
            }, 50);
          });
        });
    });
  }
}