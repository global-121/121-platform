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
        if (this.inputDirection.y !== 0) break;
        this.inputDirection = { x: 0, y: -1 };
        break;
      case 's':
      case 'ArrowDown':
        if (this.inputDirection.y !== 0) break;
        this.inputDirection = { x: 0, y: 1 };
        break;
      case 'a':
      case 'ArrowLeft':
        if (this.inputDirection.x !== 0) break;
        this.inputDirection = { x: -1, y: 0 };
        break;
      case 'd':
      case 'ArrowRight':
        if (this.inputDirection.x !== 0) break;
        this.inputDirection = { x: 1, y: 0 };
        break;
    }
  }

  public isGameStarted = false;
  private lastRenderTime = 0;
  private snakeBody = [
    { x: 11, y: 11 },
    { x: 11, y: 12 },
    { x: 11, y: 13 },
  ];
  private inputDirection = { x: 0, y: -1 };

  // ** GAME SETTINGS ** //
  private SNAKE_SPEED = 2;

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
    this.drawSnake();
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

  getInputDirection() {
    return this.inputDirection;
  }
}
