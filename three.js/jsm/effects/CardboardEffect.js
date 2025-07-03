import {
	WebGLRenderTarget,
	OrthographicCamera,
	Scene,
	Mesh,
	PlaneGeometry,
	MeshBasicMaterial,
	Vector2,
	BufferGeometry,
	BufferAttribute,
	StereoCamera,
	LinearFilter,
	NearestFilter,
	RGBAFormat
} from 'three';

/**
 * A class that creates an Cardboard Effect.
 *
 *
 * @three_import import { CardboardEffect } from 'three/addons/effects/CardboardEffect.js';
 */

class CardboardEffect {
	
	/**
	* Constructs a new cardboard effect.
	*
	* @param {WebGLRenderer} renderer - The renderer.
	*/
	constructor( renderer ){
		
		var _camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		
		var _scene = new Scene();
		
		var _stereo = new StereoCamera();
		_stereo.aspect = 0.5;
		
		var _params = { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBAFormat };
		
		var _renderTarget = new WebGLRenderTarget( 512, 512, _params );
		_renderTarget.scissorTest = true;
		
		// Distortion Mesh ported from:
		// https://github.com/borismus/webvr-boilerplate/blob/master/src/distortion/barrel-distortion-fragment.js
		
		var distortion = new Vector2( 0.441, 0.156 );
		
		var geometry = new PlaneGeometry( 1, 1, 10, 20 );
		
		var indices = geometry.index.array;
		var positions = geometry.attributes.position.array;
		var uvs = geometry.attributes.uv.array;
		
		var vector = new Vector2();
		
		function poly( val ) {
			
			return 1.5 + ( distortion.x + distortion.y * val ) * val;
			
		}
		
		for ( var i = 0; i < indices.length; i ++ ) {
			
			vector.x = positions[ i * 3 + 0 ];
			vector.y = positions[ i * 3 + 1 ];
			
			var scalar = poly( vector.dot( vector ) );
			
			positions[ i * 3 + 0 ] = ( vector.x / scalar ) * 1.5 - 0.5;
			positions[ i * 3 + 1 ] = ( vector.y / scalar ) * 3.0;
			
			uvs[ i * 2 ] *= 0.5;
			
		}
		
		// clone geometry
		
		function copyArray( array1, array2, offset ) {
			
			for ( var i = 0, l = array2.length; i < l; i ++ ) {
				
				array1[ i + offset ] = array2[ i ];
				
			}
			
		}
		
		var indices2 = new Uint16Array( indices.length * 2 );
		var positions2 = new Float32Array( positions.length * 2 );
		var uvs2 = new Float32Array( uvs.length * 2 );
		
		copyArray( indices2, indices, 0 );
		copyArray( positions2, positions, 0 );
		copyArray( uvs2, uvs, 0 );
		
		var offset = positions.length / 3;
		
		for ( i = 0; i < indices.length; i ++ ) {
			
			indices[ i ] += offset;
			positions[ i * 3 ] += 1.0;
			uvs[ i * 2 ] += 0.5;
			
		}
		
		copyArray( indices2, indices, indices.length );
		copyArray( positions2, positions, positions.length );
		copyArray( uvs2, uvs, uvs.length );
		
		var geometry2 = new BufferGeometry();
		geometry2.setIndex( new BufferAttribute( indices2, 1 ) );
		geometry2.setAttribute( 'position', new BufferAttribute( positions2, 3 ) );
		geometry2.setAttribute( 'uv', new BufferAttribute( uvs2, 2 ) );
		
		// var material = new MeshBasicMaterial( { wireframe: true } );
		var material = new MeshBasicMaterial( { map: _renderTarget.texture } );
		var mesh = new Mesh( geometry2, material );
		_scene.add( mesh );
		
		//
		
		this.setSize = function ( width, height ) {
			
			_renderTarget.setSize( width, height );
			
			renderer.setSize( width, height );
			
		}
		
		this.render = function ( scene, camera ) {
			
			scene.updateMatrixWorld();
			
			if ( camera.parent === null ) camera.updateMatrixWorld();
			
			_stereo.update( camera );
			
			var width = _renderTarget.width / 2;
			var height = _renderTarget.height;
			
			_renderTarget.scissor.set( 0, 0, width, height );
			_renderTarget.viewport.set( 0, 0, width, height );
			renderer.render( scene, _stereo.cameraL, _renderTarget );
			
			_renderTarget.scissor.set( width, 0, width, height );
			_renderTarget.viewport.set( width, 0, width, height );
			renderer.render( scene, _stereo.cameraR, _renderTarget );
			
			renderer.render( _scene, _camera );
			
		}
		
	}
	
}

export { CardboardEffect };

