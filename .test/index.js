#!/usr/bin/env node
import tape from "tape"
import Delay from "delay"
import DurationAtLeast from "../duration-at-least.js"

tape( "duration at least", async function( t){
	t.plan( 1)
	let count= 0
	const
		// start a DurationAtLeast
		durationAtLeast= new DurationAtLeast( 4),
		// read as fast as we can
		loop= (async function(){
			for await( let loop of durationAtLeast){
				++count
			}
		})()
	loop.catch(function( err){
		t.fail( `should not have failed ${err}`)
	})
	// wait some time
	await Delay( 50)
	// end iteration
	durationAtLeast.return()

	t.equal( count, 13)
	t.end()
})
