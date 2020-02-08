import Defer from "p-defer"

export function AsyncIterDurationAtLeast( opt= {}){
	// upconvert opt to a duration if it's only a number
	if( !isNaN( opt)){
		opt= {
			duration: opt
		}
	}
	Object.assign( this, {
		/**
		* duration between iterations will be at least this many ms
		*/
		duration: {
			value: opts.duration|| 1000
		},
		/**
		* call out when the next free tick is
		* note that this may race far ahead if multiple .next()'s are called
		*/
		nextEpoch: {
			value: 0
		},
	})
	// bind abort
	this.abort= this.abort.bind( this)
	// call the setter for signal
	this.signal= opt.signal
	return this
}
export default AsyncIterDurationAtLeast

const Signal= Symbol.for( "async-iter-duration-at-least:signal")

/**
* Find when our next
*/
async function next(){
	if( this.done){
		return {
			done: true,
			value: undefined
		}
	}

	const
		now= Date.now(),
		newLast= this.lastEpoch+ duration,
		diff= now- atLeast
	if( diff< 0){
		this.lastEpoch= newLast
		// TODO: early return
		await Delay( diff)
		if( this.done){
			return {
				value: undefined,
				done: true
			}
		}else{
			return {
				value: this.state,
				done: false
			}
		}
	}

	this.lastEpoch= now
	return {
		value: this,
		done: false
	}

}

const
	wrapper= {
		throw: async function( err){
			this.done= true
			throw err
		},
		return: async function( value){
			this.done= true
			return {
				done: true,
				value
			}
		}
	},
	throw_= wrapper.throw,
	return_= wrapper.return

function abort(){
	this.done= true
}

// signal setter/getter
function getSignal(){
	return this[ Signal]
}
function setSignal( value){
	const oldSignal= this[ Signal]
	if( oldSignal){
		oldSignal.removeEventListener( "abort", this.abort)
	}
	this[ Signal]= value
	if( value){
		if( value.aborted){
			this.abort()
		}
		value.addEventListener( "abort", this.abort)
	}
}

function free(){
	const signal= this[ Signal]
	if( signal){
		this.removeEventListener( "abort", this.abort)
	}
}

function state(){
	return this
}

AsyncIterDurationAtLeast.prototype= Object.create( null, {
	// async iterator methods
	next: {
		value: next
	},
	return: {
		value: return_
	},
	throw: {
		value: throw_
	},
	// abort methods
	abort: {
		value: abort
	},
	signal: {
		get: getSignal,
		set: setSignal
	},
	// remaining
	free: {
		value: free
	},
	state: {
		value: state
	}
})

