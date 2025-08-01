import {
	Euler,
	EventDispatcher,
	MathUtils,
	Quaternion,
	Vector3
} from 'three';

const _zee = new Vector3( 0, 0, 1 );
const _euler = new Euler();
const _q0 = new Quaternion();
const _q1 = new Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

const _changeEvent = { type: 'change' };

class DeviceOrientationControls extends EventDispatcher {
	
	constructor( object ) {
		
		super();
		
		if ( window.isSecureContext === false ) {
			
			console.error( 'THREE.DeviceOrientationControls: DeviceOrientationEvent is only available in secure contexts (https)' );
			
		}
		
		const scope = this;
		
		const EPS = 0.000001;
		const lastQuaternion = new Quaternion();
		
		this.object = object;
		this.object.rotation.reorder( 'YXZ' );
		
		this.enabled = true;
		
		this.deviceOrientation = {};
		this.screenOrientation = 0;
		
		this.alphaOffset = 0; // radians
		
		const onDeviceOrientationChangeEvent = function ( event ) {
			
			scope.deviceOrientation = event;
			
		};
		
		const onScreenOrientationChangeEvent = function () {
			
			scope.screenOrientation = screen.orientation.angle || 0;
			
		};
		
		// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''
		
		const setObjectQuaternion = function (quaternion, alpha, beta, gamma, orient) {
			
			console.log('--- setObjectQuaternion ---');
			console.log('alpha:', alpha);
			console.log('beta:', beta);
			console.log('gamma:', gamma);
			console.log('orient (screen orientation):', orient);
			
			_euler.set(beta, alpha, -gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us
			console.log('Euler (radians):', _euler.x, _euler.y, _euler.z);
			
			quaternion.setFromEuler(_euler); // orient the device
			console.log('Quaternion after setFromEuler:', quaternion.x, quaternion.y, quaternion.z, quaternion.w);
			
			quaternion.multiply(_q1); // camera looks out the back of the device, not the top
			console.log('Quaternion after multiply _q1:', quaternion.x, quaternion.y, quaternion.z, quaternion.w);
			
			quaternion.multiply(_q0.setFromAxisAngle(_zee, -orient)); // adjust for screen orientation
			console.log('Quaternion after screen orientation adjustment:', quaternion.x, quaternion.y, quaternion.z, quaternion.w);
		};
		
		
		this.connect = function () {
			
			onScreenOrientationChangeEvent(); // run once on load
			
			// iOS 13+
			
			if ( window.DeviceOrientationEvent !== undefined && typeof window.DeviceOrientationEvent.requestPermission === 'function' ) {
				
				window.DeviceOrientationEvent.requestPermission().then( function ( response ) {
					
					if ( response == 'granted' ) {
						
						screen.orientation.addEventListener( 'orientationchange', onScreenOrientationChangeEvent );
						window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent );
					}
					
				} ).catch( function ( error ) {
					
					console.error( 'THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error );
					
				} );
				
			} else {
				
				screen.orientation.addEventListener( 'orientationchange', onScreenOrientationChangeEvent );
				window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent );
			}
			
			scope.enabled = true;
			
		};
		
		this.disconnect = function () {
			
			screen.orientation.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent );
			window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent );
			
			scope.enabled = false;
			
		};
		
		this.update = function () {
			
			if ( scope.enabled === false ) return;
			
			const device = scope.deviceOrientation;
			
			if ( device ) {
				
				const alpha = device.alpha ? MathUtils.degToRad( device.alpha ) + scope.alphaOffset : 0; // Z
				
				const beta = device.beta ? MathUtils.degToRad( device.beta ) : 0; // X'
				
				const gamma = device.gamma ? MathUtils.degToRad( device.gamma ) : 0; // Y''
				
				const orient = scope.screenOrientation ? MathUtils.degToRad( scope.screenOrientation ) : 0; // O
				
				setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );
				
				if ( 8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {
					
					lastQuaternion.copy( scope.object.quaternion );
					scope.dispatchEvent( _changeEvent );
					
				}
				
			}
			
		};
		
		this.dispose = function () {
			
			scope.disconnect();
			
		};
		
		this.connect();
		
	}
	
}

export { DeviceOrientationControls };
