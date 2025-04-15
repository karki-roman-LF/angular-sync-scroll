import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
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
export class CdkScrollbarSyncDemoComponent {
  items = Array.from({ length: 50 }).map((_, i) => `Item #${i + 1}`);

  tableData = Array.from({ length: 20 }, (_, i) =>
    Array.from({ length: 10 }, (_, j) => `Cell ${i}-${j}`)
  );
}