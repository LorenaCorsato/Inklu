import { Component, HostBinding } from '@angular/core';
import { LucideArrowLeftFromLine, LucideHome, LucideCalendarCheck, LucideUser, LucideCalendar, LucideFileText, LucideSettings, LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-navbar',
  imports: [LucideArrowLeftFromLine, LucideHome, LucideCalendarCheck, LucideUser, LucideCalendar, LucideFileText, LucideSettings, LucidePlus],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  isCollapsed: boolean = false;
  
  @HostBinding('class.collapsed') get collapsed() {
    return this.isCollapsed;
  }

  toggleNavbar() {
    this.isCollapsed = !this.isCollapsed;
  }
}