import { Autocomplete, Grid, TextField } from '@mui/material';
import { isValidCountryCode, isValidPhone } from '../../utils';

const countryCodes = [
  { country: 'United States / Canada', code: '+1' },
  { country: 'United Kingdom', code: '+44' },
  { country: 'Australia', code: '+61' },
  { country: 'New Zealand', code: '+64' },
  { country: 'India', code: '+91' },
  { country: 'Pakistan', code: '+92' },
  { country: 'Bangladesh', code: '+880' },
  { country: 'Sri Lanka', code: '+94' },
  { country: 'Nepal', code: '+977' },
  { country: 'Singapore', code: '+65' },
  { country: 'Malaysia', code: '+60' },
  { country: 'Indonesia', code: '+62' },
  { country: 'Philippines', code: '+63' },
  { country: 'Thailand', code: '+66' },
  { country: 'China', code: '+86' },
  { country: 'Japan', code: '+81' },
  { country: 'South Korea', code: '+82' },
  { country: 'United Arab Emirates', code: '+971' },
  { country: 'Saudi Arabia', code: '+966' },
  { country: 'Qatar', code: '+974' },
  { country: 'South Africa', code: '+27' },
  { country: 'Nigeria', code: '+234' },
  { country: 'Kenya', code: '+254' },
  { country: 'Egypt', code: '+20' },
  { country: 'Germany', code: '+49' },
  { country: 'France', code: '+33' },
  { country: 'Italy', code: '+39' },
  { country: 'Spain', code: '+34' },
  { country: 'Netherlands', code: '+31' },
  { country: 'Switzerland', code: '+41' },
  { country: 'Sweden', code: '+46' },
  { country: 'Norway', code: '+47' },
  { country: 'Denmark', code: '+45' },
  { country: 'Ireland', code: '+353' },
  { country: 'Russia', code: '+7' },
  { country: 'Turkey', code: '+90' },
  { country: 'Brazil', code: '+55' },
  { country: 'Mexico', code: '+52' },
  { country: 'Argentina', code: '+54' },
  { country: 'Chile', code: '+56' },
];

interface PhoneFieldsProps {
  countryCode: string;
  phone: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function PhoneFields({
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  disabled = false,
  required = false,
}: PhoneFieldsProps) {
  const countryCodeInvalid = Boolean(countryCode && !isValidCountryCode(countryCode));
  const options = countryCode && !countryCodes.some((option) => option.code === countryCode)
    ? [{ country: `Other (${countryCode})`, code: countryCode }, ...countryCodes]
    : countryCodes;
  const selectedCountryCode = options.find((option) => option.code === countryCode) ?? null;
  const phoneInvalid = Boolean(phone && !isValidPhone(phone));
  const phoneError = phoneInvalid
    ? /\D/.test(phone)
      ? 'Use digits only (0–9).'
      : 'Enter exactly 10 digits.'
    : undefined;

  return (
    <>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          options={options}
          value={selectedCountryCode}
          onChange={(_, option) => onCountryCodeChange(option?.code ?? '')}
          getOptionLabel={(option) => `${option.country} (${option.code})`}
          isOptionEqualToValue={(option, value) => option.code === value.code}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Country Code"
              placeholder="Search country or code"
              required={required}
              error={countryCodeInvalid}
              helperText={countryCodeInvalid ? 'Select a valid country code.' : undefined}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Phone Number"
          fullWidth
          required={required}
          disabled={disabled}
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          error={phoneInvalid}
          helperText={phoneError ?? 'Enter 10 digits, without the country code'}
          slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{10}' } }}
        />
      </Grid>
    </>
  );
}
