import { helper } from '@ember/component/helper';
/**
 * 
 * HACK/FIX for not really understanding why the Cracked sequencer seems to play the sound 1 step
 * later the index it is supposedly on
 */
export default helper(function seqStepOffset([index, sequence]/*, hash*/) { 
  if (index === 0) {
    return sequence.length -1;
  } else {
    return index - 1;
  }
});
