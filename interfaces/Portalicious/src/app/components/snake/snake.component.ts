import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

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
  private inputDirection = { x: 0, y: -1 };
  private lastInputDirection = { x: 0, y: -1 };
  private snakeBody = [
    { x: 11, y: 11 },
    { x: 11, y: 12 },
    { x: 11, y: 13 },
  ];
  private foodPosition = { x: 1, y: 11 };

  // ** GAME SETTINGS ** //
  private SNAKE_SPEED = 5;
  private EXPANSION_RATE = 1;

  ngAfterViewInit(): void {
    this.drawSnake();
  }

  public startButtonClick() {
    this.isGameStarted = true;
    window.requestAnimationFrame(this.gameLoop.bind(this));
  }

  private gameLoop(currentTime: number) {
    window.requestAnimationFrame(this.gameLoop.bind(this));
    const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / this.SNAKE_SPEED) return;

    this.lastRenderTime = currentTime;

    this.updateSnake();
    this.updateFood();
    this.drawSnake();
    this.drawFood();
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
    this.board.nativeElement.innerHTML = '';
    this.snakeBody.forEach((segment) => {
      const snakeElement = document.createElement('div');
      snakeElement.style.gridRowStart = segment.y.toString();
      snakeElement.style.gridColumnStart = segment.x.toString();
      snakeElement.classList.add('bg-green-500', 'border-black', 'border-2');
      this.board.nativeElement.appendChild(snakeElement);
    });
  }

  private updateFood() {
    if (this.isSnakeOnFood()) {
      this.expandSnake();
      this.foodPosition = {
        x: Math.floor(Math.random() * 21) + 1,
        y: Math.floor(Math.random() * 21) + 1,
      };
    }
  }

  private drawFood() {
    const foodElement = document.createElement('div');
    foodElement.style.gridRowStart = this.foodPosition.y.toString();
    foodElement.style.gridColumnStart = this.foodPosition.x.toString();
    foodElement.classList.add('bg-red-500', 'border-black', 'border-2');
    this.board.nativeElement.appendChild(foodElement);
  }

  private getInputDirection() {
    this.lastInputDirection = this.inputDirection;
    return this.inputDirection;
  }

  private isSnakeOnFood(): boolean {
    return this.snakeBody.some((segment) => {
      return (
        segment.x === this.foodPosition.x && segment.y === this.foodPosition.y
      );
    });
  }

  private expandSnake() {
    for (let i = 0; i < this.EXPANSION_RATE; i++) {
      this.snakeBody.push({ ...this.snakeBody[this.snakeBody.length - 1] });
    }
  }
}
