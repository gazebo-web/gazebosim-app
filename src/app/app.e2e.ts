import { browser, by, element } from 'protractor';

describe('App', () => {

  beforeEach(() => {
    browser.get('/');
  });

  it('should have a title', () => {
    const subject = browser.getTitle();
    const result  = 'Ignition Fuel';
    expect<any>(subject).toEqual(result);
  });

  it('should have header', () => {
    const subject = element(by.css('h1')).isPresent();
    const result  = true;
    expect<any>(subject).toEqual(result);
  });

  it('should have <home>', () => {
    const subject = element(by.css('app home')).isPresent();
    const result  = true;
    expect<any>(subject).toEqual(result);
  });

  it('should have buttons', () => {
    const subject = element(by.css('button')).getText();
    const result  = 'Submit Value';
    expect<any>(subject).toEqual(result);
  });

});
