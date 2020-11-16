import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';
//import { Configuration, PresetView, PhoenixMenuNode, FaserLoader } from 'phoenix-event-display';
import { Configuration, PresetView, PhoenixMenuNode, PhoenixLoader } from 'phoenix-event-display';

@Component({
  selector: 'app-faser',
  templateUrl: './faser.component.html',
  styleUrls: ['./faser.component.scss']
})
export class FaserComponent implements OnInit {
  phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');

  constructor(private eventDisplay: EventDisplayService) { }

  ngOnInit() {
    // Define the configuration
    const configuration: Configuration = {
      eventDataLoader: new PhoenixLoader(),
      //eventDataLoader: new FaserLoader(),
      presetViews: [
        new PresetView('Left View', [0, 0, -12000], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
        new PresetView('Right View', [0, 0, 12000], 'right-cube')
      ],
      defaultView: [4000, 4000, 4000],
      // Set the phoenix menu to be used (defined above)
      phoenixMenuRoot: this.phoenixMenuRoot,
      // Default event data to fallback to if none given in URL
      // Do not set if there should be no event loaded by default
      //defaultEventFile: {
      //  eventFile: 'assets/files/JiveXML/JiveXML_336567_2327102923.xml',
      //  eventType: 'jivexml'
      //}
    };

    // Initialize the event display
    this.eventDisplay.init(configuration);

    // // Load the JSON file containing event data
    // this.http.get('assets/files/event_data/fasereventdump2.json')
    //   .subscribe((res: any) => {
    //     // Parse the JSON to extract events and their data
    //     this.eventDisplay.parsePhoenixEvents(res);
    //   });

    // Load detector geometries
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/FASER/Calorimeter_v2.obj', 'Calorimeter', 0x8c8c8c, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/FASER/PreShowerStation_v3.obj', 'Preshower', 0x356aa5, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/FASER/TimingStation_v8.obj', 'Timing', 0xfff400, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/FASER/VetoStation_v3.obj', 'Veto', 0xc14343, false);
  }
}
