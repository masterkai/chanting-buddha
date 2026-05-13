import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the default chant text', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('南無阿彌陀佛');
  });

  it('should render 25 groups per round for a 1000 chant target', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as App & {
      beginPractice: () => void;
      pause: () => void;
      totalRounds: () => number;
    };

    app.targetCount = 1000;
    app.beginPractice();
    app.pause();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(app.totalRounds()).toBe(40);
    expect(compiled.querySelectorAll('.chant-group').length).toBe(25);
    expect(compiled.textContent).toContain('1/40');
  });
});
