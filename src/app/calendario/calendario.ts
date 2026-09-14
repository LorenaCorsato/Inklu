import { Component } from '@angular/core';
import { LucideCalendar, LucideConstruction } from '@lucide/angular';

@Component({
  selector: 'app-calendario',
  imports: [LucideCalendar, LucideConstruction],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
})
export class Calendario {}
