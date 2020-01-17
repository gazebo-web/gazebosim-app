import { World } from './world';

describe('World', () => {

  const world = new World({});

  it(`should set 'worlds' as a resource type`, () => {
    expect(world.type).toBe('worlds');
  });

  it(`should have allowed extensions`, () => {
    expect(World.allowedExtensions.length).toBeGreaterThan(0);
  });
});
