/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

declare module 'react-easy-crop' {
	import * as React from 'react'

	export interface Area {
		x: number
		y: number
		width: number
		height: number
	}

	export interface Point {
		x: number
		y: number
	}

	export type CropShape = 'rect' | 'round' | 'square'

	export interface CropperProps {
		image: string
		crop: Point
		zoom: number
		rotation?: number
		aspect?: number
		cropShape?: CropShape
		showGrid?: boolean
		zoomWithScroll?: boolean
		objectFit?: 'contain' | 'cover' | 'horizontal-cover' | 'vertical-cover'
		onCropChange?: (location: Point) => void
		onZoomChange?: (zoom: number) => void
		onRotationChange?: (rotation: number) => void
		onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void
		classes?: Partial<Record<string, string>>
		style?: React.CSSProperties
		restrictPosition?: boolean
		minZoom?: number
		maxZoom?: number
		cropSize?: { width: number; height: number }
	}

	const Cropper: React.FC<CropperProps>
	export default Cropper
}