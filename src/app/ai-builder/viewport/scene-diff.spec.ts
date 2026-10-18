import { changedObjects } from "./scene-diff";

const world = (body: string) =>
  `<?xml version="1.0"?><sdf version="1.10"><world name="w">${body}</world></sdf>`;

const floor = `<model name="floor"><static>true</static></model>`;
const light = `<light name="sun" type="directional"/>`;
const rover = `<include><uri>model://rover</uri><name>rover_1</name><pose>1 0 0 0 0 0</pose></include>`;
const chair = `<include><uri>https://fuel.gazebosim.org/1.0/OpenRobotics/models/Chair</uri></include>`;

describe("changedObjects", () => {
  it("lists every object of a new world", () => {
    expect(changedObjects("", world(floor + light + rover + chair))).toEqual([
      "floor",
      "rover_1",
      "Chair",
    ]);
  });

  it("lists added and edited objects, not unchanged or removed ones", () => {
    const moved = rover.replace("1 0 0", "2 0 0");
    expect(
      changedObjects(world(floor + rover + chair), world(floor + moved)),
    ).toEqual(["rover_1"]);
    expect(changedObjects(world(floor), world(floor + chair))).toEqual([
      "Chair",
    ]);
  });

  it("lists includes of a rebuilt project model", () => {
    const w = world(floor + rover + chair);
    expect(changedObjects(w, w, ["rover"])).toEqual(["rover_1"]);
    expect(changedObjects(w, w, ["crate"])).toEqual([]);
  });

  it("ignores text that doesn't parse", () => {
    expect(changedObjects(world(floor), "<sdf><world>")).toEqual([]);
    expect(changedObjects("<sdf>", world(floor))).toEqual(["floor"]);
  });
});
