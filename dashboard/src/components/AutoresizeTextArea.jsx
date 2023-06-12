export default function AutoResizeTextarea({ name, value, onChange, placeholder = 'Description' }) {
  console.log('value', value);
  return (
    <div className="relative h-min grow">
      <div aria-hidden className="pointer-events-none invisible" placeholder={placeholder}>
        {value?.split('\n').map((item, key) => (
          <span key={key}>
            {item}
            <br />
          </span>
        ))}
      </div>
      <textarea defaultValue={value} name={name} id={name} onChange={onChange} className="absolute inset-0 h-full w-full" placeholder={placeholder} />
    </div>
  );
}
