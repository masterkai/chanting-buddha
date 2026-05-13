import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SliderModule } from 'primeng/slider';

type AppStep = 'chant' | 'count' | 'practice' | 'complete';

type ChantGroup = {
  index: number;
  displayIndex: number;
  chars: string[];
  state: 'completed' | 'current' | 'upcoming';
};

type BeatOption = {
  label: string;
  ms: number;
};

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    ProgressBarModule,
    SliderModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  private readonly groupsPerRound = 25;

  chantText = '南無阿彌陀佛';
  targetCount = 25;
  beatLevel = 1;
  readonly beatOptions: BeatOption[] = [
    { label: '1秒', ms: 1000 },
    { label: '1/2秒', ms: 500 },
    { label: '1/3秒', ms: 333 },
    { label: '1/4秒', ms: 250 }
  ];

  protected readonly step = signal<AppStep>('chant');
  protected readonly isRunning = signal(false);
  protected readonly completedGroups = signal(0);
  protected readonly activeCharIndex = signal(0);

  protected readonly chantChars = computed(() => Array.from(this.cleanChantText()));
  protected readonly safeCount = computed(() => this.safeTargetCount());
  protected readonly totalRounds = computed(() =>
    Math.ceil(this.safeCount() / this.groupsPerRound)
  );
  protected readonly currentRound = computed(() =>
    Math.min(
      this.totalRounds(),
      Math.floor(this.completedGroups() / this.groupsPerRound) + 1
    )
  );
  protected readonly totalChars = computed(() => this.chantChars().length * this.safeCount());
  protected readonly finishedChars = computed(() => {
    const completedChars = this.completedGroups() * this.chantChars().length;
    return Math.min(completedChars + this.activeCharIndex(), this.totalChars());
  });
  protected readonly progress = computed(() => {
    const total = this.totalChars();
    return total ? Math.round((this.finishedChars() / total) * 100) : 0;
  });
  protected readonly visibleGroups = computed<ChantGroup[]>(() => {
    const groups: ChantGroup[] = [];
    const roundStart = (this.currentRound() - 1) * this.groupsPerRound;
    const roundEnd = Math.min(roundStart + this.groupsPerRound, this.safeCount());
    const chars = this.chantChars();

    for (let index = roundStart; index < roundEnd; index += 1) {
      groups.push({
        index,
        displayIndex: index - roundStart + 1,
        chars,
        state:
          index < this.completedGroups()
            ? 'completed'
            : index === this.completedGroups()
              ? 'current'
              : 'upcoming'
      });
    }

    return groups;
  });

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.stopTimer();
  }

  protected goToCount(): void {
    this.chantText = this.cleanChantText();
    this.step.set('count');
  }

  protected backToChant(): void {
    this.stopTimer();
    this.step.set('chant');
  }

  protected beginPractice(): void {
    this.targetCount = this.safeTargetCount();
    this.completedGroups.set(0);
    this.activeCharIndex.set(0);
    this.step.set('practice');
    this.start();
  }

  protected start(): void {
    if (this.isRunning() || this.step() !== 'practice') {
      return;
    }

    this.isRunning.set(true);
    this.timerId = setInterval(() => this.advanceBeat(), this.currentBeatMs());
  }

  protected pause(): void {
    this.stopTimer();
  }

  protected reset(): void {
    this.stopTimer();
    this.completedGroups.set(0);
    this.activeCharIndex.set(0);
    this.step.set('chant');
  }

  protected applyBeat(): void {
    this.beatLevel = Math.max(0, Math.min(this.beatOptions.length - 1, Number(this.beatLevel) || 0));

    if (this.isRunning()) {
      this.stopTimer();
      this.start();
    }
  }

  protected currentBeatLabel(): string {
    return this.beatOptions[this.beatLevel]?.label ?? this.beatOptions[0].label;
  }

  protected charState(group: ChantGroup, charIndex: number): 'done' | 'active' | 'pending' {
    if (group.state === 'completed') {
      return 'done';
    }

    if (group.state === 'current') {
      if (charIndex < this.activeCharIndex()) {
        return 'done';
      }

      if (charIndex === this.activeCharIndex() && this.isRunning()) {
        return 'active';
      }
    }

    return 'pending';
  }

  private advanceBeat(): void {
    const nextChar = this.activeCharIndex() + 1;

    if (nextChar < this.chantChars().length) {
      this.activeCharIndex.set(nextChar);
      return;
    }

    const nextGroup = this.completedGroups() + 1;
    this.completedGroups.set(nextGroup);
    this.activeCharIndex.set(0);

    if (nextGroup >= this.safeCount()) {
      this.stopTimer();
      this.step.set('complete');
    }
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.isRunning.set(false);
  }

  private currentBeatMs(): number {
    return this.beatOptions[this.beatLevel]?.ms ?? this.beatOptions[0].ms;
  }

  private cleanChantText(): string {
    const cleaned = this.chantText.trim();
    return cleaned.length ? cleaned : '南無阿彌陀佛';
  }

  private safeTargetCount(): number {
    return Math.max(1, Math.min(9999, Math.floor(Number(this.targetCount) || 1)));
  }
}
