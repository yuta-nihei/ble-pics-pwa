// PICS parser - ported from yumu19/ble-pics-viewer (MIT) process_pics()
// Manufacturer payload only: company ID 0x01CE is NOT included in value
export const MANUFACTURER_ID = 0x01CE;
const SIGNAL_STATES = ['NoSignal','Red','BlinkGreen','Green','None'];
export const SIGNAL_LABELS = { NoSignal:'信号なし', Red:'赤', BlinkGreen:'青点滅', Green:'青', None:'対象なし', Unknown:'不明' };
export function toBytes(data){
  if(ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if(data instanceof ArrayBuffer) return new Uint8Array(data);
  throw new TypeError('ArrayBuffer required');
}
export function hexDump(data){ return Array.from(toBytes(data), b=>b.toString(16).padStart(2,'0').toUpperCase()).join(' '); }
export function processPics(data){
  const bytes = toBytes(data);
  if(bytes.length < 10) throw new RangeError('PICS header too short');
  const type = bytes[2];
  const min = {0:24,1:18,2:11}[type] ?? 10;
  if(bytes.length < min) throw new RangeError(`Type ${type} too short`);
  const info = { message_type:type, message_id:bytes[3], intersection_id: hexDump(bytes.subarray(6,10)).replaceAll(' ','') };
  if(type===0){
    info.identifier = new TextDecoder().decode(bytes.subarray(10,24)).replaceAll('\uFFFD','').replace(/^\0+|\0+$/g,'').trim();
  } else if(type===1){
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    info.latitude = v.getInt32(10,false)/1_000_000;
    info.longitude = v.getInt32(14,false)/1_000_000;
  } else if(type===2){
    info.pedestrian_signals = Array.from(bytes.subarray(10,16), byte=>({
      remaining_time: (byte>>4)>=8 ? -1 : (byte>>4)+1,
      signal_state: SIGNAL_STATES[byte & 0x0f] ?? 'Unknown',
    }));
  }
  return info;
}
export function demoPackets(step){
  const header=(type,len)=>{ const d=new Uint8Array(len); d[2]=type; d[3]=step%256; d.set([0,0,0,1],6); return d; };
  const name=header(0,24); name.set(new TextEncoder().encode('DEMO CROSSING'),10);
  const pos=header(1,18); const v=new DataView(pos.buffer); v.setInt32(10,35681236,false); v.setInt32(14,139767125,false);
  const sig=header(2,16); const phase=step%24;
  const ew = phase<8?3: phase<12?2:1; const ns = phase<12?1: phase<20?3:2;
  const rem = (7-(step%8))<<4; sig.set([rem|ew, rem|ns, 0x84,0x84,0x84,0x84],10);
  return step===0 ? [name,pos,sig] : [sig];
}
