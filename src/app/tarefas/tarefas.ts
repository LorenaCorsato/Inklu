import { Component } from '@angular/core';
import { LucideCalendarCheck, LucideConstruction } from '@lucide/angular';

@Component({
  selector: 'app-tarefas',
  imports: [LucideCalendarCheck, LucideConstruction],
  templateUrl: './tarefas.html',
  styleUrl: './tarefas.scss',
})
export class Tarefas {}
