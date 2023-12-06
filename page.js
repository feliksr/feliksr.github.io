// page.js
class Page{
    constructor() {
        // access server locally or online
        // this.url = `http://localhost:5000/`
        this.url = 'https://froyzen.pythonanywhere.com/'

        // Initial page parameters
        this.groupTypes = {
            'Target Stimulus' : ['Soccerball','Trophy','Vase'],
            'Stimulus Type' : ['Target','Distractor','Irrelevant'],
            'Stimulus Identity' :  ['Soccerball', 'Trophy', 'Vase']
        }

        this.trial = 1,
        this.channel = 1,
        this.meanTrials = false,
        this.ANOVA =  false,
        this.frequencyBins = [
            { min: 60, max: 200 },
            { min: 20, max: 60 },
            { min: 0, max: 20 }
        ];
        
        this.excludedContainers =  document.querySelectorAll('.excluded-trials-container');
        this.excludedContainers.forEach(container => container.style.display = 'none');
        const ids = [
            'trialSlider', 'colorbarLabel', 'channelDisplay', 'ANOVAbutton',
            'meanTrialsButton', 'loadingText', 'excludeTrialButton',
            'pVal', 'prevChan', 'nextChan', 'yAxisLabel', 'trialNumber', 'allChansANOVA', 'pValId', 'warning'
        ];
        
        ids.forEach(id => {
            this[id] = document.getElementById(id);
        });
        
        this.channelDisplay.textContent = 'Channel 1' 

        const allButtons = new window.Buttons(this)
        allButtons.set_channelButtons()
        allButtons.set_stimButtons()
        allButtons.set_groupButtons()

        this.containers= ['#container1', '#container2', '#container3'];
        
        this.trialSlider.addEventListener('input', (event) => {
            this.trial = event.target.value;
            this.trialSlider.value = this.trial
            this.trialNumber.textContent = this.trial
            this.LFPplot.initialize(); 
        })

        this.excludeTrialButton.addEventListener('click', () => {
            const trialButtonId = `trialButton-${this.group}-${this.trial}`;
            const trialButton = document.getElementById(trialButtonId);
        
            if (trialButton) {
                this.excludedTrialsContainer[this.group].removeChild(trialButton);
            } else {
                const button = document.createElement('button');
                button.textContent = `Trial ${this.trial}`;
                button.id = trialButtonId;
                this.excludedTrialsContainer[this.group].appendChild(button);
        
                button.addEventListener('click', () => {
                    this.trialSlider.value = parseInt(trialButtonId.split('-')[2]);
                    this.trialSlider.dispatchEvent(new Event('input'));
                });
            }
            
            this.excludeTrialButton.classList.toggle('active');
            this.getData();
        });
            
                
        
        this.meanTrialsButton.addEventListener('click', () => {
            this.meanTrials = !this.meanTrials; 
            this.meanTrialsButton.classList.toggle('active');
            
            this.trialSlider.disabled = this.meanTrials
            this.excludeTrialButton.disabled = this.meanTrials
            
            
            if (this.meanTrials) {
                this.ANOVAbutton.style.display = 'none'
            } else {
                this.ANOVAbutton.style.display = 'inline-block';
            }
              
            this.trial = 1;
            this.getData();
        });

        this.ANOVAbutton.addEventListener('click', () => {
            this.ANOVA = !this.ANOVA; 
            this.ANOVAbutton.classList.toggle('active');
            
            if (this.ANOVA) {
                this.warning.style.display = 'inline-block'
                this.pValId.style.display = 'inline-block'
                this.allChansANOVA.style.display = 'inline-block'
                this.pVal.style.display = 'inline-block'; 
                this.pVal.focus();
                this.excludeTrialButton.style.display = 'none';
                this.meanTrialsButton.style.display = 'none';
                this.trialSlider.style.display = 'none'
                this.trialNumber.style.display = 'none'
                this.trialSlider.previousElementSibling.textContent = ''
                this.excludedContainers.forEach(container => container.style.display = 'flex');

                
            } else {
                this.allChansANOVA.style.display = 'none'
                this.warning.style.display = 'none'
                this.pValId.style.display = 'none'
                this.excludeTrialButton.style.display = 'inline-block'; 
                this.meanTrialsButton.style.display = 'inline-block'; 
                this.trialSlider.style.display = 'inline-block'
                this.trialNumber.style.display = 'inline-block'
                this.trialSlider.previousElementSibling.textContent = 'Trial:'
                this.excludedContainers.forEach(container => container.style.display = 'none');
                this.excludedTrialsContainer[this.group].style.display= 'flex'  
                this.pVal.style.display = 'none'; 
            }
                
            // disables and greys out trial groups buttons when ANOVA button pressed 
            document.querySelectorAll('.groupButton').forEach(button => {
                if (button.textContent !== this.group) {
                    button.classList.toggle('active');
                }
                button.disabled = !button.disabled;
            });
            this.trial = 1;
            this.getData();
        });
                
        this.allChansANOVA.addEventListener('click', async () =>{
            this.allANOVA = !this.allANOVA; 
            this.allChansANOVA.classList.toggle('active');
            await this.getData();
            this.trialSlider.style.display = 'inline-block'

        })
        
        
    }


    async getData() {
        
        this.trialSlider.disabled = true; // Disable trial slider while loading data
        this.loadingText.style.display = "block";  // Display "Loading..." while data loads
        
        if (this.allANOVA){
        const chanResponse = await fetch(this.url + 'chans', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },

            })
            const chanNums = await chanResponse.json();
            this.numChans = chanNums.length
        } else {
            this.numChans = 1
        }
        console.log(`Number of channels: ${this.numChans}`)
        
        if (this.ANOVA){
            const args = {
                stimGroup: this.stimGroup,
                allGroups: this.groupTypes[this.stimGroup],
                excludedTrialsContainer: this.excludedTrialsContainer        
            }

            this.allWaveletTrials = {}
            this.allLFPTrials = {}

            for (let chans = 1; chans < (this.numChans + 1); chans++) { 
                
                if (this.allANOVA){
                    args.currentChannel = chans
                    
                } else{
                    args.currentChannel = this.channel
                }
                console.log(`channel: ${args.currentChannel}`)
                const response = await fetch(this.url + 'anova', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(args)
                })
                const responseData = await response.json();

                this.allWaveletTrials[chans] = responseData.trialsWavelet[1]
                this.allLFPTrials[chans] = responseData.trialsLFP[1]
            }        

        } else {
            
            const args = {
                group: this.group,
                stimGroup: this.stimGroup,
                currentChannel: this.channel,
                meanTrials: this.meanTrials,
                excludedTrialsContainer: this.excludedTrialsContainer      
    
            }

            const response = await fetch(this.url, {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(args)
                        })
            
            const responseData = await response.json();
            this.allWaveletTrials = responseData.trialsWavelet
            this.allLFPTrials = responseData.trialsLFP
        }

        this.singleTrialWavelet = this.allWaveletTrials[this.trial];
        this.singleTrialLFP = this.allLFPTrials[this.trial];
        
        this.trialNumber.textContent = this.trial
        this.trialSlider.value = this.trial
        this.trialSlider.max = Object.keys(this.allWaveletTrials).length;
        this.trialSlider.disabled = false;

        this.loadingText.style.display = "none";  // Hide "Loading..."
        
        this.setContainers();
    }


    setContainers() {
        this.containers.forEach((container,index) => {
            const freqBin = this.frequencyBins[index];
            const heatmap = new window.Heatmap(this,container,freqBin);
            heatmap.initialize();
            const colorbar = new window.Colorbar(heatmap);
            colorbar.initColorbar();
        })
        this.LFPplot = new window.LFPchart(this)
        this.LFPplot.initialize()
    }

    getPowerValues(freqBin) {
        let powerValues = [];

        Object.entries(this.allWaveletTrials).forEach(([trialNum, array]) => {
            const trialButtonId = `trialButton-${this.group}-${trialNum}`;
            const isExcluded = document.getElementById(trialButtonId) !== null;
    
            if (!isExcluded) {
                array.forEach(d => {
                    if (d.frequency >= freqBin.min && d.frequency <= freqBin.max) {
                        powerValues.push(d.power);
                    };
                });
            }
        });
        return powerValues;
    }

    setColorScale(heatmap){
       const freqBin = heatmap.freqBin

       if (this.ANOVA === true){
            heatmap.ANOVA = true
            heatmap.maxPower = this.pVal.value
            heatmap.colorScale = d3.scaleSequential(d3.interpolateViridis).domain([heatmap.maxPower,0])
            this.colorbarLabel.textContent = 'p-Value'
        }
        else {
            heatmap.ANOVA = false
            heatmap.maxPower = 3 * d3.deviation(this.getPowerValues(freqBin))
            heatmap.colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, heatmap.maxPower])
            this.colorbarLabel.innerHTML = 'Power  (uV / Hz<sup>2</sup>)'
        }
    }
} 

const page = new Page;
