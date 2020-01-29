/**
 * A mapping of license name to icons.
 */
const licenseImages: Map<string, string> = new Map([
    ['Creative Commons - Public Domain', 'assets/icon/cc_public_domain.svg'],
    ['Creative Commons - Attribution', 'assets/icon/cc_attribution.svg'],
    ['Creative Commons - Attribution - Share Alike',
      'assets/icon/cc_attribution_sa.svg'],
    ['Creative Commons - Attribution - No Derivatives',
      'assets/icon/cc_attribution_nd.svg'],
    ['Creative Commons - Attribution - Non Commercial',
      'assets/icon/cc_attribution_nc.svg'],
    ['Creative Commons - Attribution - Non Commercial - Share Alike',
      'assets/icon/cc_attribution_nc_sa.svg'],
    ['Creative Commons - Attribution - Non Commercial - No Derivatives',
      'assets/icon/cc_attribution_nc_nd.svg'],
  ]);

/**
 * A class that represents a License.
 */
export class License {

  /**
   * License ID number.
   */
  public id: number;

  /**
   * License name.
   */
  public name: string;

  /**
   * URL of the summary of the License's legal code.
   */
  public url: string;

  /**
   * Image badge of the License.
   */
  public image: string;

  /**
   * @param json A JSON that contains the required fields of the license.
   */
  constructor(json: JSON) {
    this.id = json['license_id'];
    this.name = json['license_name'];
    this.url = json['license_url'];

    // Set the license image
    if (licenseImages.has(this.name)) {
      this.image = licenseImages.get(this.name);
    } else {
      this.image = 'assets/icon/cc_zero.svg';
    }
  }
}
