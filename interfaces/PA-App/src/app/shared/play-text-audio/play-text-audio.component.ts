import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Howl } from 'howler';
import {
  LoggingEvent,
  LoggingEventCategory,
} from 'src/app/models/logging-event.enum';
import { LoggingService } from 'src/app/services/logging.service';
import { environment } from 'src/environments/environment';

const enum PlayerState {
  loading,
  ready,
  playing,
  paused,
  error,
}

@Component({
  selector: 'play-text-audio',
  templateUrl: './play-text-audio.component.html',
  styleUrls: ['./play-text-audio.component.scss'],
})
export class PlayTextAudioComponent implements OnInit {
  @Input()
  public key: string;

  @Input()
  public size: string;

  @Input()
  public color: string;

  public alwaysVisible = environment.alwaysShowTextPlayer;
  public isDisabled = false;
  public iconName: string;
  public buttonLabel: string;

  private state: PlayerState;
  private player: Howl;
  private labels: {
    loading: 'Loading';
    play: 'Play';
    pause: 'Pause';
  };

  constructor(
    private translate: TranslateService,
    private logger: LoggingService,
  ) {
    this.labels = {
      loading: this.translate.instant('speak-text.loading'),
      play: this.translate.instant('speak-text.play'),
      pause: this.translate.instant('speak-text.pause'),
    };

    this.translate.onLangChange.subscribe(() => {
      this.createPlayer();
    });
  }

  ngOnInit() {
    this.createPlayer();
  }

  private createPlayer() {
    this.isDisabled = false;
    this.player = new Howl({
      src: this.getSourceUrls(this.key),
      preload: true,
      onload: () => this.setState(PlayerState.ready),
      onloaderror: (_SOUNDID: any, error: string) => this.onLoadError(error),
      onplayerror: () => this.setState(PlayerState.error),
      onend: () => this.setState(PlayerState.ready),
    });
  }

  private onLoadError(error: string) {
    console.warn(`SpeakTextAudio : load error for [${this.key}]:`, error);
    this.setState(PlayerState.error);
    this.isDisabled = true;
  }

  private getSourceUrls(key: string) {
    const languageCode = this.translate.currentLang;

    return [
      `./assets/i18n/${languageCode}/${key}.webm`,
      `./assets/i18n/${languageCode}/${key}.mp3`,
    ];
  }

  public toggleState() {
    switch (this.state) {
      case PlayerState.error:
        console.warn(`SpeakTextAudio: error for [${this.key}]`);
        break;
      case PlayerState.playing:
        this.player.pause();
        this.setState(PlayerState.paused);
        this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.audioPause, {
          name: this.key,
        });
        break;
      default:
        this.player.play();
        this.setState(PlayerState.playing);
        this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.audioPlay, {
          name: this.key,
        });
    }
  }

  public setState(state: PlayerState) {
    this.state = state;
    this.setLabel(state);
    this.setIcon(state);
  }

  private setLabel(state: PlayerState) {
    switch (state) {
      case PlayerState.loading:
        this.buttonLabel = this.labels.loading;
        break;
      case PlayerState.playing:
        this.buttonLabel = this.labels.pause;
        break;
      case PlayerState.paused:
      case PlayerState.ready:
        this.buttonLabel = this.labels.play;
        break;
      case PlayerState.error:
      default:
        this.buttonLabel = '';
    }
  }

  private setIcon(state: PlayerState) {
    switch (state) {
      case PlayerState.loading:
        this.iconName = 'hourglass';
        break;
      case PlayerState.playing:
        this.iconName = 'pause';
        break;
      case PlayerState.paused:
      case PlayerState.ready:
        this.iconName = 'play';
        break;
      case PlayerState.error:
        if (!this.alwaysVisible) {
          this.iconName = 'alert';
        } else {
          this.iconName = 'play';
        }
        break;
      default:
        this.iconName = 'play';
    }
  }
}
