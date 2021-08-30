const Embed = ({ link, subtitle, thumbnail_path }) => (
  <div className="flex-col mb-6 flex-center">
    <div className="mb-3 w-92">
      <div className="relative pt-6.19 w-full overflow-hidden">
        <a
          className="absolute top-0 left-0 w-full h-full  hover:fill-current hover:text-red-500"
          href={link}>
          <img src={thumbnail_path} class="object-contain" target="_blank" />
          <svg
            height="68px"
            className="absolute inset-0 m-auto"
            width="68px"
            fill="#000000"
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            x="0px"
            y="0px"
            viewBox="0 0 100 100"
            enableBackground="new 0 0 68 68">
            <path
              fill="currentColor"
              d="M91.25,24.75c-7.875-6-25.375-6.293-41.25-6.293v0c-15.875,0-33.375,0.293-41.25,6.293  s-8.125,19-8.125,26.75s0.25,20.75,8.125,26.75S34.125,84.544,50,84.544v-0.001c15.875,0,33.375-0.293,41.25-6.293  s8.125-19,8.125-26.75S99.125,30.75,91.25,24.75z M65.646,53.248l0.003,0.004L38.823,67.548c-0.144,0.104-0.301,0.187-0.47,0.251  l-0.033,0.018l-0.002-0.007c-0.217,0.078-0.448,0.128-0.692,0.128c-1.139,0-2.062-0.924-2.062-2.062V37.062  c0-1.139,0.924-2.062,2.062-2.062c0.321,0,0.622,0.08,0.893,0.211l0.001-0.001l27.129,14.542l-0.001,0.002  c0.585,0.364,0.978,1.008,0.978,1.747C66.625,52.24,66.231,52.884,65.646,53.248z"></path>
          </svg>
        </a>
      </div>
    </div>
    <p className="text-gray-400 text-center">
      {subtitle}
      <br />
      Cliquez sur la vignette pour ouvrir la vidéo dans un nouvel onglet.
    </p>
  </div>
);

export default Embed;
