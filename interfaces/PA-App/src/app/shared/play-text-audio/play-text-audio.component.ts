import { Component, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Howl } from 'howler';

const enum PlayerState {
  loading = 'loading',
  ready = 'ready',
  playing = 'playing',
  paused = 'paused',
  error = 'error',
}

@Component({
  selector: 'play-text-audio',
  templateUrl: './play-text-audio.component.html',
  styleUrls: ['./play-text-audio.component.scss'],
})
export class PlayTextAudioComponent implements OnInit {
  @Input()
  public key: string;

  public isDisabled = false;
  public iconName: string;
  public buttonLabel: string;

  private state: PlayerState;
  private player: Howl;
  private labels: {
    loading: 'Loading',
    play: 'Play',
    pause: 'Pause',
  };

  constructor(
    private translate: TranslateService,
  ) {
    this.labels = {
      loading: this.translate.instant('speak-text.loading'),
      play: this.translate.instant('speak-text.play'),
      pause: this.translate.instant('speak-text.pause'),
    };
  }

  async ngOnInit() {
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
      case PlayerState.playing:
        this.player.pause();
        this.setState(PlayerState.paused);
        break;
      default:
        this.player.play();
        this.setState(PlayerState.playing);
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
      default:
        this.iconName = 'alert';
    }
  }
}
