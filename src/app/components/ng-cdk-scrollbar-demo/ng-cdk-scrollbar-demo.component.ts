import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkScrollSyncDirective } from '../../directives/ng-scroll-sync-cdk/ng-scroll-sync-cdk.directive';

@Component({
  selector: 'app-cdk-scrollbar-demo',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    CdkScrollSyncDirective
  ],
  templateUrl: './ng-cdk-scrollbar-demo.component.html',
  styleUrls: ['./ng-cdk-scrollbar-demo.component.less'],
})
export class CdkScrollbarDemoComponent {
  items = Array.from({ length: 50 }, (_, i) => `#${i + 1}`);

  tableData = Array.from({ length: 20 }, (_, i) =>
    Array.from({ length: 10 }, (_, j) => `Cell ${i}-${j}`)
  );
  
  // Optional example of how to set up scroll groups
  scrollGroups = [
    ['group1-scroll1', 'group1-scroll2'],
    ['group2-scroll1', 'group2-scroll2']
  ];
}