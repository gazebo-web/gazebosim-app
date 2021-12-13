import { RobotType } from './robot-type';

/**
 * Interface describing a Robot.
 */
export interface Robot {
    /**
     * Robot name
     */
    name: string;

    /**
     * Robot image URL
     */
    image: string;

    /**
     * Robot type
     */
    type: RobotType;

    /**
     * Optional: Marsupial Partner
     */
    partner?: string;
}
