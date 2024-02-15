// 2D ising model.
// Written to use relatively little memory at the cost of slightly more cpu usage: 
// nearest-neighbour lookup tables for each lattice site not used/stored.
'use strict';

// Returns the 1D lattice index from real-space coords (x,y)
function xy_to_i(x, y, Nx)
{
    return y * Nx + x;
}

// Returns the x-coordinate of a lattice site with index i
function i_to_x(i, Nx)
{
    return i % Nx;
}

// Returns the y-coordinate of a lattice site with index i
function i_to_y(i, Nx)
{
    return Math.floor(i / Nx);
}

// Apply periodic boundary condition to coordinate, r, with dimension size Nr.
function apply_pbc(r, Nr)
{
    if ((r < 0) || (r >= Nr)) {
        return (r + Nr) % Nr;
    }
    return r;
}

// Map 2d array indices to a 1d index.
// arr[i=0..ni-1][j=0..nj-1].
function idx2Darr(i, j, nj)
{
    return nj*i + j;
}

function nn_idx(i, nn_vec, dim, dir, Nx, Ny)
{
    // i = index of current lattice site
    // dir = 0, 1, 2, 3 for 2d lattice
    let j=-1;
    
    // get coordinates of chosen lattice site
    let xi = i_to_x(i, Nx);
    let yi = i_to_y(i, Nx);

    // get coordinates of chosen nearest neighbour
    let xj = xi + nn_vec[idx2Darr(dir,0,dim)];
    let yj = yi + nn_vec[idx2Darr(dir,1,dim)];

    // apply periodic boundary conditions to ensure valid coordinates
    xj = apply_pbc(xj, Nx);
    yj = apply_pbc(yj, Ny);

    // return index of updated coordinates
    j = xy_to_i(xj, yj, Nx);

    return j;
}

// total (not average) magnetisation of system
function magnetisation_tot(lattice, N)
{
    let M = 0;

    for (let i=0; i<N; i++) {
        M += lattice[i];
    }
    return M;
}

// total energy of system, (H/kT)/eps (not per site)
function energy_tot_eps(lattice, N, eps, dim, nn_vec, nn_count, Nx, Ny)
{
    let H_tot = 0;
    for (let i = 0; i < N; i++)
    {
        H_tot += energy_site_eps(lattice, i, eps, dim, nn_vec, nn_count, Nx, Ny);
    }
    // Account for double counting interactions
    return H_tot / 2.0; 
}

// energy of a site, (H/kT)/eps, from interactions with its neighbours
function energy_site_eps(lattice, i, eps, dim, nn_vec, nn_count, Nx, Ny)
{
    let si = lattice[i];
    let sj_sum = nn_sum(lattice, i, dim, nn_vec, nn_count, Nx, Ny);
    return -si*sj_sum;
}

// sum of neighbouring spins
function nn_sum(lattice, i, dim, nn_vec, nn_count, Nx, Ny)
{
    let sj_sum = 0;
    for (let dir = 0; dir < nn_count; dir++) {
        sj_sum += lattice[nn_idx(i, nn_vec, dim, dir, Nx, Ny)];
    }
    return sj_sum;
}


// Example site indices:
// 00 01 02 03
// 04 05 06 07
// 08 09 10 11
//
// Example coordinates:
// (0,0) (1,0) (2,0) (3,0)
// (0,1) (1,1) (2,1) (3,1)
// (0,2) (1,2) (2,2) (3,2)

// Set up the nearest-neightbour vector table
// nn_vec is a 1d mapping of a 2d([nn_count][dim]) array
function setup_2D_nn_table(nn_vec, N, nn_count, dim)
{
    nn_vec[idx2Darr(0, 0, dim)] =  0;    nn_vec[idx2Darr(0, 1, dim)] =  1;
    nn_vec[idx2Darr(1, 0, dim)] =  1;    nn_vec[idx2Darr(1, 1, dim)] =  0;
    nn_vec[idx2Darr(2, 0, dim)] =  0;    nn_vec[idx2Darr(2, 1, dim)] = -1;
    nn_vec[idx2Darr(3, 0, dim)] = -1;    nn_vec[idx2Darr(3, 1, dim)] =  0;
}

// Allocate spins to set up the initial state of the lattice (all = +1)
function intial_lattice_state(lattice, N)
{
    for (let i=0; i<N; i++) {
        lattice[i] = 1;
    }
}

// Run the Monte Carlo simulation
function run_sim(Nx, Ny, eps, steps_eq_per_site, steps_st_per_site, sf_per_site, of_per_site)
{
    // Total # spins
    const N = Nx * Ny;

    // Lattice of spins: +1, -1
    let lattice = new Array(N);

    // Nearest neighbour table
    const nn_count = 4;
    const dim = 2;                                  // Number of spatial dimensions
    let nn_vec = new Array(nn_count*dim);
    setup_2D_nn_table(nn_vec, N, nn_count, dim);    // Set up table of vectors pointing to nearest-neighbours for a 2d grid

    // Randomly allocate spins on lattice
    intial_lattice_state(lattice, N);

    // Get initial magnetisation and energy of the whole lattice
    let MN = magnetisation_tot(lattice, N);
    let HN_eps = energy_tot_eps(lattice, N, eps, dim, nn_vec, nn_count, Nx, Ny);

    // Monte Carlo loop variables
    let nsamples, M_sum, Msq_sum, M4_sum, H_sum, Hsq_sum;
    nsamples=M_sum=Msq_sum=M4_sum=H_sum=Hsq_sum=0;

    // Main Monte Carlo simulation loop
    for (let k = 1-steps_eq_per_site; k <= steps_st_per_site; k++)
    {
        for (let m = 0; m < N; m++)
        {
            // Perform a Monte Carlo step
            let arr = mc_step(lattice, eps, N, nn_vec, nn_count, dim, Nx, Ny);
            MN += arr[0];
            HN_eps += arr[1];
        }

        // Sample thermodynamic averages every sf_per_site mcs per site
        if (k % sf_per_site == 0) {
            if (k > 0) {
                let M_tmp = Math.abs(MN);
                M_sum += M_tmp;
                Msq_sum += M_tmp*M_tmp;
                M4_sum += M_tmp * M_tmp * M_tmp * M_tmp;
                let H_tmp = HN_eps*eps;
                H_sum += H_tmp;
                Hsq_sum += H_tmp*H_tmp;
                nsamples++;
            }
        }
        // Output thermodynamic averages every of_per_site mcs per site
        if ((k % of_per_site == 0)) { // && (k > 0)) {
            let U4 = 1.0 - (M4_sum/nsamples) / (3.0*(Msq_sum*Msq_sum/nsamples/nsamples));
            let Cv = eps*eps*(Hsq_sum/nsamples-H_sum*H_sum/nsamples/nsamples);
            let Chi = eps*(Msq_sum/nsamples-M_sum*M_sum/nsamples/nsamples);

            // Post message containing results back to main thread
            postMessage(
                {
                    'mcs': k,
                    'results': {
                        'M': M_sum / N / nsamples,
                        'UL': U4,
                        'Cv': Cv / N,
                        'chi': Chi / N,
                        'H': H_sum / N / nsamples
                    },
                    'lattice': lattice
                }
            );
        }
    }
}


// returns the change in magnetisation and H/epskT through the step
function mc_step(lattice, eps, N, nn_vec, nn_count, dim, Nx, Ny)
{
    // Pick a site at random
    let i = Math.floor(Math.random() * N);
    let si = lattice[i];

    // Calculate sum of neighbouring spins
    let sj_sum = nn_sum(lattice, i, dim, nn_vec, nn_count, Nx, Ny);

    // Decide whether or not to accept the move (short-circuit OR).
    let dH_eps = 2.0*si*sj_sum;
    let dH = dH_eps*eps;
    if ((dH <= 0) || (Math.random() < Math.exp(-dH)))
    {
        lattice[i] = -lattice[i];
        return [2*lattice[i],dH_eps];
    }
    return [0,0];
}


// Receives a message from main thread only once to start the Monte Carlo simulation
onmessage = (event) => {
    const { data } = event;

    if (('params' in data) && ('kT_J' in data))
    {
        run_sim(data['params']['Nx'], data['params']['Ny'], 1.0/data['kT_J'], data['params']['neq'], data['params']['nst'], data['params']['fs'], data['params']['fo']);
    }
};

