import { Model } from './model';

describe('Model', () => {

  const model = new Model({});

  it(`should set 'models' as a resource type`, () => {
    expect(model.type).toBe('models');
  });

  it(`should have allowed extensions`, () => {
    expect(Model.allowedExtensions.length).toBeGreaterThan(0);
  });
});
