attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  // Transmet les coordonnées de texture au fragment shader
  vTexCoord = aTexCoord;

  // Positionne le shader sur le canvas
  vec4 positionVec4 = vec4(aPosition, 1.0);
  
  // Recentre et redimensionne pour occuper tout l'écran WEBGL
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  
  gl_Position = positionVec4;
}
