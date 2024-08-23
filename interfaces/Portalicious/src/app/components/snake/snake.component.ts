import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
  public isGameStarted = false;

  private lastRenderTime = 0;
  private snakeBody = [
    { x: 11, y: 11 },
    { x: 11, y: 12 },
    { x: 11, y: 13 },
  ];

  // ** GAME SETTINGS ** //
  private SNAKE_SPEED = 1;

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
    console.log(
      '🚀 ~ SnakeComponent ~ updateSnake ~ this.snakeBody:',
      this.snakeBody,
    );
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
}
