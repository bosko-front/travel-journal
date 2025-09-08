import {Dimensions, Platform} from 'react-native';

const { width, height } = Dimensions.get('window');

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;


const scale = (size:any) => (width / guidelineBaseWidth) * size;
const verticalScale = (size:any) => (height / guidelineBaseHeight) * size;
const moderateScale = (size:any, factor = 0.5) => size + (scale(size) - size) * factor;
const isTablet = width > 768;
const isAndroid = Platform.OS === 'android';


export { scale, verticalScale, moderateScale, isTablet, width, height,isAndroid };
