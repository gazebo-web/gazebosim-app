/**
 * A class that represents a custom Simulation Rule.
 */
export class SimulationRule {

  /**
   * Available Rule Types. The Keys of this Map are the values shown to users,
   * while the values of the Map are used in the interaction with the Server.
   */
  public static readonly ruleTypes = new Map<string, string>([
    ['Max Submissions', 'max_submissions'],
  ]);

  /**
   * The circuit the rule is being applied to.
   */
  public circuit: string;

  /**
   * The owner this rule is being applied to.
   */
  public owner: string;

  /**
   * The rule type used by the Server.
   */
  public type: string;

  /**
   * The name of the rule type. This value should be presented to users.
   */
  public typeName: string;

  /**
   * The value applied to the rule type.
   */
  public value: number;

  /**
   * @param json A JSON that contains the required fields of the resource.
   */
  constructor(json: any) {
    this.circuit = json['circuit'];
    this.owner = json['owner'];
    this.type = json['rule_type'];
    this.value = json['value'];

    // The Server returns the rule type. Get the name of it from the Rules Map.
    this.typeName = Array.from(SimulationRule.ruleTypes.keys()).find((key) => {
      return SimulationRule.ruleTypes.get(key) === this.type;
    });
  }

  /**
   * Determine if the rule is equal to another one.
   * To be the same, rules need to have the same circuit, owner and type.
   *
   * @param rule The rule to check equality.
   * @returns A boolean whether the passed rule is equal or not.
   */
  public isEqual(rule: SimulationRule): boolean {
    return rule.circuit === this.circuit && rule.owner === this.owner && rule.type === this.type;
  }
}
