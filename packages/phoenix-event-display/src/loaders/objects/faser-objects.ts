import { Vector3, Object3D, CatmullRomCurve3, TubeBufferGeometry, MeshToonMaterial, Mesh, BufferGeometry, LineBasicMaterial, Line, Group, Quaternion, CylinderBufferGeometry, MeshBasicMaterial, BufferAttribute, PointsMaterial, Points, BoxBufferGeometry, MeshPhongMaterial, SphereBufferGeometry } from 'three';
import { EVENT_DATA_TYPE_COLORS } from '../../helpers/constants';
import { RKHelper } from '../../helpers/rk-helper';

/**
 * Physics objects that make up an event in Faser.
 */
export class FaserObjects {

  /**
   * Process the Track from the given parameters (and positions)
   * and get it as a geometry.
   * @param trackParams Parameters of the Track.
   * @returns Track object.
   */
  public static getTrack(trackParams: any): Object3D {
    let positions = trackParams.pos;
    // Track with no points
    // if (positions.length==0) {
    //   console.log("Track with no positions.")
    //   return;
    // }

    // Track with too few points are extrapolated with RungeKutta
    if (positions.length < 3) {
      if (trackParams?.dparams) {
        // Test, for ATLAS. 
        // FIXME - make configurable
        let inBounds = function (pos: Vector3) {
          if (pos.z > 3000)
            return false;
          if (Math.sqrt(pos.x * pos.x + pos.y * pos.y) > 1100)
            return false;

          return true
        };

        positions = RKHelper.extrapolateTrackPositions(trackParams, inBounds);
      }
    }
    // Check again, in case there was an issue with the extrapolation.
    if (positions.length < 3) {
      return;
    }


    // const length = 100;
    let objectColor = EVENT_DATA_TYPE_COLORS['Tracks'].getHex();
    if (trackParams.color) {
      objectColor = parseInt(trackParams.color, 16);
    }

    // // Apply pT cut TODO - make this configurable.
    // const momentum = trackParams.mom;
    // if (momentum) {
    //   if (momentum[0] * momentum[0] + momentum[1] * momentum[1] + momentum[2] * momentum[2] < 0.25) {
    //     // console.log('Track mom<0.5 GeV. Skipping. Positions are: ' + positions + ' particle_id: ' + track.particle_id);
    //     return;
    //   }
    // }

    const points = [];

    for (let i = 0; i < positions.length; i++) {
      points.push(new Vector3(positions[i][0], positions[i][1], positions[i][2]));
    }

    // attributes
    const curve = new CatmullRomCurve3(points);

    // TubeGeometry
    const geometry = new TubeBufferGeometry(curve, undefined, 2);
    const material = new MeshToonMaterial({ color: objectColor });
    const tubeObject = new Mesh(geometry, material);

    // Line - Creating a Line to put inside the tube to show tracks even on zoom out
    const vertices = curve.getPoints(50);
    const lineGeometry = new BufferGeometry().setFromPoints(vertices);
    const lineMaterial = new LineBasicMaterial({
      color: objectColor,
      linewidth: 2
    });
    const lineObject = new Line(lineGeometry, lineMaterial);
    lineObject.name = 'Track';

    // Creating a group to add both the Tube curve and the Line
    const trackObject = new Group();
    trackObject.add(tubeObject);
    trackObject.add(lineObject);

    // Setting info to the tubeObject and trackObject for selection and cuts
    for (let object of [tubeObject, trackObject]) {
      object.userData = Object.assign({}, trackParams);
      object.name = 'Track';
    }

    // Setting uuid for selection from collections info
    trackParams.uuid = tubeObject.uuid;

    return trackObject;
  }

  /**
   * Process the Jet from the given parameters and get it as a geometry.
   * @param jetParams Parameters for the Jet.
   * @returns Jet object.
   */
  public static getJet(jetParams: any): Object3D {
    const eta = jetParams.eta;
    const phi = jetParams.phi;
    // If theta is given then use that else calculate from eta
    const theta = jetParams.theta ? jetParams.theta : (2 * Math.atan(Math.pow(Math.E, eta)));
    // Jet energy parameter can either be 'energy' or 'et'
    let length = (jetParams.energy ? jetParams.energy : jetParams.et) * 0.2;
    // Ugh - We don't want the Jets to go out of the event display
    if (length > 3000) {
      length = 3000;
    }
    const width = length * 0.1;

    const sphi = Math.sin(phi);
    const cphi = Math.cos(phi);
    const stheta = Math.sin(theta);
    const ctheta = Math.cos(theta);
    //
    const translation = new Vector3(0.5 * length * cphi * stheta, 0.5 * length * sphi * stheta, 0.5 * length * ctheta);

    const x = cphi * stheta;
    const y = sphi * stheta;
    const z = ctheta;
    const v1 = new Vector3(0, 1, 0);
    const v2 = new Vector3(x, y, z);
    const quaternion = new Quaternion();
    quaternion.setFromUnitVectors(v1, v2);

    const geometry = new CylinderBufferGeometry(width, 1, length, 50, 50, false); // Cone

    const material = new MeshBasicMaterial({ color: EVENT_DATA_TYPE_COLORS['Jets'], opacity: 0.3, transparent: true });
    material.opacity = 0.5;
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(translation);
    mesh.quaternion.copy(quaternion);
    mesh.userData = Object.assign({}, jetParams);
    mesh.name = 'Jet';
    // Setting uuid for selection from collections info
    jetParams.uuid = mesh.uuid;

    return mesh;
  }

  /**
   * Process the Hits from the given parameters and get them as a geometry.
   * @param hitsParams Parameters for the Hits.
   * @returns Hits object.
   */
  public static getHits(hitsParams: any): Object3D {
    let positions: any[];
    let hitsParamsClone: any;

    // If the parameters is an object then take out 'pos' for hits positions
    if (typeof hitsParams === 'object' && !Array.isArray(hitsParams)) {
      positions = [hitsParams.pos];
      hitsParamsClone = hitsParams;
    } else {
      positions = hitsParams;
      hitsParamsClone = { pos: hitsParams };
    }

    // attributes
    const pointPos = new Float32Array(positions.length * 3);
    let i = 0;
    for (const hit of positions) {
      pointPos[i] = hit[0];
      pointPos[i + 1] = hit[1];
      pointPos[i + 2] = hit[2];
      i += 3;
    }

    // geometry
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(pointPos, 3));
    geometry.computeBoundingSphere();
    // material
    const material = new PointsMaterial({ size: 100, color: EVENT_DATA_TYPE_COLORS['Hits'] });
    // object
    const pointsObj = new Points(geometry, material);
    pointsObj.userData = Object.assign({}, hitsParamsClone);
    pointsObj.name = 'Hit';
    // Setting uuid for selection from collections info
    hitsParams.uuid = pointsObj.uuid;

    return pointsObj;
  }

  /**
   * Process the Cluster from the given parameters and get it as a geometry.
   * @param clusterParams Parameters for the Cluster.
   * @returns Cluster object.
   */
  public static getCluster(clusterParams: any): Object3D {
    const length = 510;
    // geometry
    const geometry = new BoxBufferGeometry(115, 115, length);
    // material
    const material = new MeshPhongMaterial({ color: EVENT_DATA_TYPE_COLORS['CaloClusters'] });
    // object
    const cube = new Mesh(geometry, material);
    cube.position.x = clusterParams.x;
    cube.position.y = clusterParams.y;
    cube.position.z = clusterParams.z;
    cube.lookAt(new Vector3(0, clusterParams.y, clusterParams.z));
    cube.userData = Object.assign({}, clusterParams);
    cube.name = 'Cluster';
    // Setting uuid for selection from collections info
    clusterParams.uuid = cube.uuid;

    return cube;
  }

  /**
   * Large scintillator hit
   * @param clusterParams Parameters for the Cluster.
   * @returns Cluster object.
   */
  public static getLargeScintHits(largeScintParams: any): Object3D {

    let objectColor = EVENT_DATA_TYPE_COLORS['CaloClusters'].getHex();
    if (largeScintParams.color) {
      objectColor = parseInt(largeScintParams.color, 16);
    }

    const length = 10;
    // geometry
    const geometry = new BoxBufferGeometry(260, 260, length);
    // material
    const material = new MeshPhongMaterial({ color: objectColor });
    // object
    const cube = new Mesh(geometry, material);
    cube.position.x = largeScintParams.x;
    cube.position.y = largeScintParams.y;
    cube.position.z = largeScintParams.z;
    cube.lookAt(new Vector3(0, largeScintParams.y, largeScintParams.z));
    cube.userData = Object.assign({}, largeScintParams);
    cube.name = 'LargeScintHitCluster';
    // Setting uuid for selection from collections info
    largeScintParams.uuid = cube.uuid;

    return cube;
  }

  /**
   * Timing scintillator hit
   * @param clusterParams Parameters for the Cluster.
   * @returns Cluster object.
   */
  public static getTimingScintHits(timingScintParams: any): Object3D {

    let objectColor = EVENT_DATA_TYPE_COLORS['CaloClusters'].getHex();
    if (timingScintParams.color) {
      objectColor = parseInt(timingScintParams.color, 16);
    }

    const length = 8;
    // geometry
    const geometry = new BoxBufferGeometry(400, 150, length);
    // material
    const material = new MeshPhongMaterial({ color: objectColor });
    // object
    const cube = new Mesh(geometry, material);
    cube.position.x = timingScintParams.x;
    cube.position.y = timingScintParams.y;
    cube.position.z = timingScintParams.z;
    cube.lookAt(new Vector3(0, timingScintParams.y, timingScintParams.z));
    cube.userData = Object.assign({}, timingScintParams);
    cube.name = 'TimingScintHitCluster';
    // Setting uuid for selection from collections info
    timingScintParams.uuid = cube.uuid;

    return cube;
  }

  /**
   * Process the Vertex from the given parameters and get it as a geometry.
   * @param vertexParams Parameters for the Vertex.
   * @returns Vertex object.
   */
  public static getVertex(vertexParams: any): Object3D {
    // geometry
    const geometry = new SphereBufferGeometry(3);
    // material
    const material = new MeshPhongMaterial({ color: EVENT_DATA_TYPE_COLORS['Vertices'] });
    // object
    const sphere = new Mesh(geometry, material);
    sphere.position.x = vertexParams.x;
    sphere.position.y = vertexParams.y;
    sphere.position.z = vertexParams.y;

    sphere.userData = Object.assign({}, vertexParams);
    sphere.name = 'Vertex';
    // Setting uuid for selection from collections info
    vertexParams.uuid = sphere.uuid;

    return sphere;
  }

}
