import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

interface Vector {
  x: number;
  y: number;
}

@Component({
  selector: 'app-snake',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './snake.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnakeComponent implements AfterViewInit {
  @ViewChild('board', { static: false }) board: ElementRef<HTMLDivElement>;
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

  // ** GAME INTERNALS ** //
  public isGameStarted = false;
  private lastRenderTime = 0;
  private inputDirection: Vector;
  private lastInputDirection: Vector;
  private snakeBody: Vector[];
  private foodPosition: Vector;

  // ** GAME SETTINGS ** //
  private SNAKE_SPEED = 5;
  private EXPANSION_RATE = 1;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.initialize();
  }

  public startButtonClick() {
    this.isGameStarted = true;
    this.inputDirection = { x: 0, y: -1 };
    this.lastInputDirection = { x: 0, y: -1 };
    window.requestAnimationFrame(this.gameLoop.bind(this));
  }

  // ** GAME METHODS ** //

  private gameLoop(currentTime: number) {
    if (!this.isGameStarted) return;
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

  private initialize() {
    this.isGameStarted = false;
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
  }

  private checkGameOver() {
    if (
      this.isSnakeOutsideBoard() ||
      this.isSnakeIntersecting({
        position: this.snakeBody[0],
        ignoreHead: true,
      })
    ) {
      this.initialize();
    }
  }

  // ** FOOD METHODS ** //

  private updateFood() {
    if (this.isSnakeIntersecting({ position: this.foodPosition })) {
      this.expandSnake();
      this.foodPosition = this.getRandomPositionOnGrid();
    }
  }

  private drawFood() {
    const foodElement = document.createElement('div');
    foodElement.style.gridRowStart = this.foodPosition.y.toString();
    foodElement.style.gridColumnStart = this.foodPosition.x.toString();
    foodElement.classList.add('bg-red-500', 'border-red-700', 'border-2');
    this.board.nativeElement.appendChild(foodElement);
  }

  // ** SNAKE METHODS ** //

  private updateSnake() {
    const inputDirection = this.getInputDirection();
    for (let i = this.snakeBody.length - 2; i >= 0; i--) {
      this.snakeBody[i + 1] = { ...this.snakeBody[i] };
    }

    this.snakeBody[0].x += inputDirection.x;
    this.snakeBody[0].y += inputDirection.y;
  }

  private drawSnake() {
    this.board.nativeElement.innerHTML = '';
    this.snakeBody.forEach((segment) => {
      const snakeElement = document.createElement('div');
      snakeElement.style.gridRowStart = segment.y.toString();
      snakeElement.style.gridColumnStart = segment.x.toString();
      snakeElement.classList.add(
        'bg-green-500',
        'border-green-700',
        'border-2',
      );
      this.board.nativeElement.appendChild(snakeElement);
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

  // ** UTILITY METHODS ** //

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
