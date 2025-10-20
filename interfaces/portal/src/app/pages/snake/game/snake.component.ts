import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

interface Vector {
  x: number;
  y: number;
}

@Component({
  selector: 'app-snake',
  imports: [ButtonModule, DialogModule],
  templateUrl: './snake.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnakeComponent implements AfterViewInit {
  changeDetectorRef = inject(ChangeDetectorRef);
  readonly trackingService = inject(TrackingService);

  readonly board = viewChild.required<ElementRef<HTMLDivElement>>('board');

  public readonly isGameStarted = signal(false);
  public readonly isGameOver = signal(false);
  public readonly score = signal(0);
  public readonly random121Fact = signal('');

  private lastRenderTime = 0;
  private inputDirection: Vector;
  private lastInputDirection: Vector;
  private snakeBody: Vector[];
  private foodPosition: Vector;
  private SNAKE_SPEED = 6;
  private EXPANSION_RATE = 1;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'w':
      case 'ArrowUp':
        if (this.lastInputDirection.y !== 0) break;
        this.inputDirection = { x: 0, y: -1 };
        break;
      case 's':
      case 'ArrowDown':
        if (this.lastInputDirection.y !== 0) break;
        this.inputDirection = { x: 0, y: 1 };
        break;
      case 'a':
      case 'ArrowLeft':
        if (this.lastInputDirection.x !== 0) break;
        this.inputDirection = { x: -1, y: 0 };
        break;
      case 'd':
      case 'ArrowRight':
        if (this.lastInputDirection.x !== 0) break;
        this.inputDirection = { x: 1, y: 0 };
        break;
    }
  }

  ngAfterViewInit(): void {
    this.initialize();
  }

  startButtonClick() {
    this.isGameStarted.set(true);
    this.inputDirection = { x: 0, y: -1 };
    this.lastInputDirection = { x: 0, y: -1 };
    window.requestAnimationFrame(this.gameLoop.bind(this));
  }

  private gameLoop(currentTime: number) {
    if (!this.isGameStarted() || this.isGameOver()) return;
    window.requestAnimationFrame(this.gameLoop.bind(this));
    const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / this.SNAKE_SPEED) return;

    this.lastRenderTime = currentTime;

    this.updateSnake();
    this.updateFood();
    this.drawSnake();
    this.drawFood();
    this.checkGameOver();
  }

  initialize() {
    this.isGameStarted.set(false);
    this.isGameOver.set(false);
    this.inputDirection = { x: 0, y: 0 };
    this.lastInputDirection = { x: 0, y: 0 };
    this.snakeBody = [
      { x: 11, y: 11 },
      { x: 11, y: 12 },
      { x: 11, y: 13 },
    ];
    this.foodPosition = this.getRandomPositionOnGrid();

    this.drawSnake();
    this.drawFood();
    this.changeDetectorRef.detectChanges();
    this.showRandom121Fact();
  }

  private showRandom121Fact() {
    const random121Facts = [
      'The number 121 is the sum of the first 11 prime numberss',
      '121 is the 11th number in the Fibonacci sequence',
      '121 is the 15th number in the Pell sequence',
      '121 is a centered octagonal number',
      '121 is easy',
      '121 is safe',
      '121 is fast',
      'Did you know that you can share your registration table filter by copying the URL?',
      'Have you ever typed "Henry Dunant" in the search bar?',
      'By recording all data entries and changes, 121 enhances accountability and security, making auditing easier through a privacy-by-design system.',
    ];
    this.random121Fact.set(
      random121Facts[Math.floor(Math.random() * random121Facts.length)],
    );
  }

  private checkGameOver() {
    if (
      this.isSnakeOutsideBoard() ||
      this.isSnakeIntersecting({
        position: this.snakeBody[0],
        ignoreHead: true,
      })
    ) {
      this.score.set(this.snakeBody.length - 3);
      this.isGameOver.set(true);
      this.trackingService.trackEvent({
        category: TrackingCategory.hiddenFeatures,
        action: TrackingAction.showSnakeGameOver,
        value: this.score(),
      });
    }
  }

  private updateFood() {
    if (this.isSnakeIntersecting({ position: this.foodPosition })) {
      this.expandSnake();
      this.foodPosition = this.getRandomPositionOnGrid();
      this.showRandom121Fact();
    }
  }

  private drawFood() {
    const foodElement = document.createElement('div');
    foodElement.style.gridRowStart = this.foodPosition.y.toString();
    foodElement.style.gridColumnStart = this.foodPosition.x.toString();
    foodElement.classList.add('bg-red-500', 'border-red-700', 'border-2');
    this.board().nativeElement.appendChild(foodElement);
  }

  private updateSnake() {
    const inputDirection = this.getInputDirection();
    for (let i = this.snakeBody.length - 2; i >= 0; i--) {
      this.snakeBody[i + 1] = { ...this.snakeBody[i] };
    }

    this.snakeBody[0].x += inputDirection.x;
    this.snakeBody[0].y += inputDirection.y;
  }

  private drawSnake() {
    this.board().nativeElement.innerHTML = '';
    this.snakeBody.forEach((segment) => {
      const snakeElement = document.createElement('div');
      snakeElement.style.gridRowStart = segment.y.toString();
      snakeElement.style.gridColumnStart = segment.x.toString();
      snakeElement.classList.add('bg-grey-500', 'border-black', 'border');
      this.board().nativeElement.appendChild(snakeElement);
    });
  }

  private isSnakeIntersecting({
    position,
    ignoreHead = false,
  }: {
    position: { x: number; y: number };
    ignoreHead?: boolean;
  }): boolean {
    return this.snakeBody.some((segment, index) => {
      if (ignoreHead && index === 0) return false;
      return segment.x === position.x && segment.y === position.y;
    });
  }

  private expandSnake() {
    for (let i = 0; i < this.EXPANSION_RATE; i++) {
      this.snakeBody.push({ ...this.snakeBody[this.snakeBody.length - 1] });
    }
  }

  private isSnakeOutsideBoard() {
    return (
      this.snakeBody[0].x < 1 ||
      this.snakeBody[0].x > 21 ||
      this.snakeBody[0].y < 1 ||
      this.snakeBody[0].y > 21
    );
  }

  private getInputDirection() {
    this.lastInputDirection = this.inputDirection;
    return this.inputDirection;
  }

  private getRandomPositionOnGrid() {
    return {
      x: Math.floor(Math.random() * 21) + 1,
      y: Math.floor(Math.random() * 21) + 1,
    };
  }
}
