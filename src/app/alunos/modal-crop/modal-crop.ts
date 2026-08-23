import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX, LucideCrop, LucideCheck } from '@lucide/angular';
import { ImageCropperModule, CropperSettings, ImageCropperComponent } from 'ngx-img-cropper';

@Component({
  selector: 'app-modal-crop',
  standalone: true,
  imports: [FormsModule, LucideX, LucideCrop, LucideCheck, ImageCropperModule],
  templateUrl: './modal-crop.html',
  styleUrl: './modal-crop.scss',
})
export class ModalCrop implements OnChanges {
  @Input() isOpen = false;
  @Input() imageSrc: string | null = null;

  @Output() cropComplete = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('cropper', { static: false }) cropperComponent!: ImageCropperComponent;

  data: any = {};
  cropperSettings: CropperSettings;

  constructor(private cdr: ChangeDetectorRef) {
    this.cropperSettings = new CropperSettings();
    this.cropperSettings.width = 250;
    this.cropperSettings.height = 250;
    this.cropperSettings.croppedWidth = 500;
    this.cropperSettings.croppedHeight = 500;
    this.cropperSettings.canvasWidth = 320;
    this.cropperSettings.canvasHeight = 320;
    this.cropperSettings.minWidth = 50;
    this.cropperSettings.minHeight = 50;
    this.cropperSettings.rounded = false;
    this.cropperSettings.keepAspect = true;
    this.cropperSettings.noFileInput = true;
    this.cropperSettings.fileType = 'image/jpeg';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageSrc'] || changes['isOpen']) {
      if (this.isOpen && this.imageSrc) {
        setTimeout(() => {
          this.loadImage(this.imageSrc!);
        }, 50);
      }
    }
  }

  private loadImage(src: string): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (this.cropperComponent) {
        this.cropperComponent.setImage(img);
        this.cdr.detectChanges();
      }
    };
    img.src = src;
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('crop-modal-overlay')) {
      this.close();
    }
  }

  applyCrop(): void {
    if (this.data && this.data.image) {
      this.cropComplete.emit(this.data.image);
    }
  }
}
