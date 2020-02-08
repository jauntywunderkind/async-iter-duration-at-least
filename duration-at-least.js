import Delay from "delay"

export function AsyncIterDurationAtLeast( opt= {}){
	// upconvert opt to a duration if it's only a number
	if( !isNaN( opt)){
		opt= {
			duration: opt
		}
	}
	Object.defineProperties( this, {
		/**
		* duration between iterations will be at least this many ms
		*/
		duration: {
			value: opt.duration|| 1000
		},
		/**
		* call out when the next free tick is
		* note that this may race far ahead if multiple .next()'s are called
		*/
		nextEpoch: {
			value: 0,
			writable: true
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
		delay= this.nextEpoch- now
	// there is still time which must pass
	if( delay> 0){
		// anyone who comes next needs to wait yet another duration
		this.nextEpoch+= this.duration
		// but in the mean time we still have time to wait ourselves
		// TODO: early return
		await Delay( delay)

		if( this.done){
			// we got done in the meanwhile
			return {
				value: undefined,
				done: true
			}
		}
		// ok we've waited for a duration to pass
	}else{
		// next valid epoch is one duration from now
		this.nextEpoch= now+ this.duration
	}

	// enough time has already passed, so return now
	return {
		value: this.state,
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
	[ Symbol.asyncIterator]: {
		value: function(){
			return this
		}
	},
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
		value: abort,
		writable: true
	},
	signal: {
		get: getSignal,
		set: setSignal
	},
	// remaining
	free: {
		value: free,
		writable: true
	},
	state: {
		value: state,
		writable: true
	}
})
