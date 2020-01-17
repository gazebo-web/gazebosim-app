import { Logfile } from './logfile';

describe('Logfile', () => {

  it('should return the correct Status string', () => {
    const logfile = new Logfile({
      name: 'testLogfile',
    });

    // Done.
    logfile.status = 1;
    expect(logfile.getStatus()).toEqual('Approved');

    // Rejected.
    logfile.status = 2;
    expect(logfile.getStatus()).toEqual('Rejected');

    // Pending.
    logfile.status = 0;
    expect(logfile.getStatus()).toEqual('Pending');
    logfile.status = -1;
    expect(logfile.getStatus()).toEqual('Pending');
    logfile.status = undefined;
    expect(logfile.getStatus()).toEqual('Pending');
  });
});
